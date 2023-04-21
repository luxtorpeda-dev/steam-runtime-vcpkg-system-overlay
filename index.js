const fs = require('fs').promises;

async function getInstalledSystemPackages() {
    return new Promise((resolve, reject) => {
        let result = '';
        let aptList = processes.spawn('apt', ['list', '--installed']);
        aptList.stdout.once('error', reject);
        aptList.stdout.on('data', (chunk) => {
                result += chunk.toString();
        });
        aptList.stdout.once('end', () => {
            if (!result) {
                return resolve([]);
            }

            const stringArr = result.split('\n');
            const packages = [];

            console.log("ASDASD213", stringArr);

            return resolve(packages);
        });
    });
}

(async () => {
    try {

    } catch (e) {
        console.error(`top level exception: ${e.toString()}`);
    }
})();
