"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = exports.setIo = void 0;
let _io = null;
const setIo = (io) => { _io = io; };
exports.setIo = setIo;
const getIo = () => _io;
exports.getIo = getIo;
//# sourceMappingURL=ioInstance.js.map