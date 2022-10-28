"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureInstalledCorrectPrismaPackage = void 0;
const tslib_1 = require("tslib");
const semVer = tslib_1.__importStar(require("semver"));
function shouldSkipPrismaVersionCheck() {
    const value = process.env.SKIP_PRISMA_VERSION_CHECK;
    return value === "true" || value === "TRUE" || value === "1";
}
function getInstalledPrismaVersion() {
    const prismaPackageJson = require("prisma/package.json");
    return prismaPackageJson.version;
}
function getPeerDependencyPrismaRequirement() {
    const ownPackageJson = require("../../package.json");
    return ownPackageJson.peerDependencies["prisma"];
}
function ensureInstalledCorrectPrismaPackage() {
    if (shouldSkipPrismaVersionCheck()) {
        return;
    }
    const installedVersion = getInstalledPrismaVersion();
    const versionRequirement = getPeerDependencyPrismaRequirement();
    if (!semVer.satisfies(installedVersion, versionRequirement)) {
        throw new Error(`Looks like an incorrect version "${installedVersion}" ` +
            `of the Prisma packages has been installed. ` +
            `'typegraphql-prisma' works only with selected versions, ` +
            `so please ensure that you have installed a version of Prisma ` +
            `that meets the requirement: "${versionRequirement}". ` +
            `Find out more about that requirement in the docs: ` +
            `https://prisma.typegraphql.com/docs/basics/prisma-version`);
    }
}
exports.ensureInstalledCorrectPrismaPackage = ensureInstalledCorrectPrismaPackage;
//# sourceMappingURL=prisma-version.js.map