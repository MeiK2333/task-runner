"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const tslib_1 = require("tslib");
const winston_1 = require("winston");
const moment_1 = tslib_1.__importDefault(require("moment"));
const { combine, printf } = winston_1.format;
const fmt = printf(({ level, message }) => {
    const timestamp = moment_1.default().format('YYYY-MM-DD HH:mm:ss').trim();
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});
exports.logger = winston_1.createLogger({
    format: combine(fmt),
    transports: [
        new winston_1.transports.Console({ level: process.env.LOG_LEVEL || 'info' }),
    ]
});
