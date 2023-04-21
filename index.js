const fs = require('fs').promises;
const processes = require('child_process');
const path = require('path');

const vcpkgPortPath = path.join('vcpkg', 'ports');

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
    try {
        await fs.promises.access(path.join(vcpkgPortPath, name));
        vcpkgLibraries.push({
            name: name,
            version: version
        });
        return true;
    } catch (error) {
        // The check failed
    }
}

async function compareAgainstVcpkg(systemPackages) {
    const vcpkgLibraries = [];
    for(let systemPackage of systemPackages) {
        try {
            if(!await checkForVcpkgExists(systemPackage.name, systemPackage.version, vcpkgLibraries)) {
                if(!await checkForVcpkgExists(systemPackage.name.split('-dev')[0], systemPackage.version, vcpkgLibraries)) {
                    await checkForVcpkgExists(systemPackage.name.split('-dev')[0].replace('lib', ''), systemPackage.version, vcpkgLibraries)
                }
            }
        } catch (error) {
            // The check failed
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
