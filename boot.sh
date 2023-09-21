npm install -g npm@latest
npm install -g typescript@latest

echo TypeScript Version
tsc --version

echo Security Audit
npm install
npm audit
npm audit fix
tsc
npm test
#npm start | tsc -w