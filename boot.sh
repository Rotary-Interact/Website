npm install -g npm
npm install -g typescript

echo TypeScript Version
tsc --version

echo Security Audit
npm install
npm audit
npm audit fix
tsc
npm start | tsc -w