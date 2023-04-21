#!/bin/bash

# setup nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

# install npm
nvm install 18

# install npm packages
npm install

# clone vcpkg and setup
git clone https://github.com/Microsoft/vcpkg.git vcpkg
pushd vcpkg
git checkout -f 2023.04.15
popd
./vcpkg/bootstrap-vcpkg.sh

# start script
npm run start
