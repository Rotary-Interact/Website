npm install -g npm@latest
npm install -g typescript@latest
npm install -g bun

echo TypeScript Version
tsc --version

echo Security Audit
npm install
npm audit
npm audit fix
tsc
#npm test
npm start# | tsc -w