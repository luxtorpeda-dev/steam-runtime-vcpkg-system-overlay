const fs = require('fs').promises;
const processes = require('child_process');
const path = require('path');

const vcpkgPortPath = path.join(__dirname, 'vcpkg', 'ports');
const ignorePackages = ['sdl2-mixer'];
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
                const version = str.split('now ')[1].split(' ')[0];
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
                await checkForVcpkgExists(systemPackage.name.split('-dev')[0].replace('lib', ''), systemPackage.version, vcpkgLibraries)
            }
        }
    }
    return vcpkgLibraries;
}

(async () => {
    try {
        const packages = await getInstalledSystemPackages();
        const vcpkgLibraries = await compareAgainstVcpkg(packages);
        console.log('vcpkgLibraries', vcpkgLibraries);
    } catch (e) {
        console.error(`top level exception: ${e.toString()}`);
    }
})();
