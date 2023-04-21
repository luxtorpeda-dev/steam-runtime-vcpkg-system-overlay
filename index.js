const fs = require('fs').promises;
const processes = require('child_process');

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
                const packageName = str.split('/')[0];
                console.log("ASDASd123", str);
                const version = str.split('now ')[1].split(' ')[0];
                const data = {
                    package: packageName,
                    version: version
                };
                packages.push(data);
            }

            return resolve(packages);
        });
    });
}

(async () => {
    try {
        const packages = await getInstalledSystemPackages();
        console.info('packages', packages);
    } catch (e) {
        console.error(`top level exception: ${e.toString()}`);
    }
})();
