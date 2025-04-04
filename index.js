const fs = require('fs').promises;
const fsSync = require('fs');
const processes = require('child_process');
const path = require('path');

const vcpkgPortPath = path.join(__dirname, 'vcpkg', 'ports');
const overlaysPath = path.join(__dirname, 'overlays');
const ignorePackages = ['sdl2-mixer', 'libvorbis', 'libogg', 'gettext', "libwebp", "bzip2", "libflac", "opus", "opusfile", "gperf", "glslang", "libxau", "libxdmcp", "libxml2", "freetype", "icu", "glib", "libpng", "zlib", "fontconfig", "openssl", "sqlite3", "tiff"];
const foundPackagesKeys = {};

async function getInstalledSystemPackages() {
    return new Promise((resolve, reject) => {
        let result = '';
        let aptList = processes.spawn('apt', ['list', '--installed']);
        aptList.stdout.once('error', reject);
        aptList.stdout.on('data', (chunk) => {
            const chunkStr = chunk.toString();
            if(chunkStr.indexOf('Listing...') === -1) {
                result += chunkStr;
            }
        });
        aptList.stdout.once('end', () => {
            if (!result) {
                return resolve([]);
            }

            const stringArr = result.split('\n');
            const packages = [];

            for(let str of stringArr) {
                if(!str) continue;
                const packageName = str.split('/')[0];
                const version = str.split('now ')[1].split(' ')[0].split('~')[0].split('+')[0];
                const data = {
                    name: packageName,
                    version: version
                };
                packages.push(data);
            }

            return resolve(packages);
        });
    });
}

async function checkForVcpkgExists(name, version, vcpkgLibraries) {
    if(ignorePackages.indexOf(name) !== -1) return true;
    if(foundPackagesKeys[name]) return true;

    try {
        await fs.access(path.join(vcpkgPortPath, name));
        vcpkgLibraries.push({
            name: name,
            version: version
        });
        foundPackagesKeys[name] = true;
        return true;
    } catch (error) {}
}


async function compareAgainstVcpkg(systemPackages) {
    const vcpkgLibraries = [];
    for(let systemPackage of systemPackages) {
        if(!await checkForVcpkgExists(systemPackage.name, systemPackage.version, vcpkgLibraries)) {
            if(!await checkForVcpkgExists(systemPackage.name.split('-dev')[0], systemPackage.version, vcpkgLibraries)) {
                if(!await checkForVcpkgExists(systemPackage.name.split('-dev')[0].replace('lib', ''), systemPackage.version, vcpkgLibraries)) {}
            }
        }
    }
    return vcpkgLibraries;
}

function customVcpkgLibraries(vcpkgLibraries) {
    const libs = [
        { name: 'libiconv', version: '1.17'},
        { name: 'glib', version: '2.31'},
        { name: 'zlib', version: '1.2.11'},
        { name: 'alsa', version: '1.2.4'}
    ];

    for(let lib of libs) {
        const name = lib.name;
        const version = lib.version;
        vcpkgLibraries.push({
            name: name,
            version: version
        });
        foundPackagesKeys[name] = true;
    }
}

async function writePorts(libraries) {
    try {
        fsSync.rmSync(overlaysPath, { recursive: true });
    } catch(err) {}
    fsSync.mkdirSync(overlaysPath);

    for(let library of libraries) {
        if(library.name === 'openssl') {
            library.version = '1.1.1';
        }
        const libraryPath = path.join(overlaysPath, library.name);
        fsSync.mkdirSync(libraryPath);

        await fs.writeFile(path.join(libraryPath, 'portfile.cmake'), 'set(VCPKG_POLICY_EMPTY_PACKAGE enabled)');
        await fs.writeFile(path.join(libraryPath, 'vcpkg.json'), JSON.stringify(library, null, 4));
    }
}

(async () => {
    try {
        const packages = await getInstalledSystemPackages();
        const vcpkgLibraries = await compareAgainstVcpkg(packages);
        customVcpkgLibraries(vcpkgLibraries);
        console.info('vcpkgLibraries', vcpkgLibraries);
        await writePorts(vcpkgLibraries);
    } catch (e) {
        console.error(`top level exception: ${e.toString()}`);
    }
})();
