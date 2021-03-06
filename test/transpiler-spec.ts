import fs = require('fs');
import path = require('path');
import chai = require('chai');

import {CompilerHost} from '../src/compiler-host';
import {Transpiler} from '../src/transpiler';
import {formatErrors} from '../src/format-errors';

const should = chai.should();

const oneImport = fs.readFileSync(require.resolve('./fixtures-es6/program1/one-import.ts'), 'utf8');
const es6Symbol = fs.readFileSync(require.resolve('./fixtures-es6/program1/symbol.ts'), 'utf8');
const syntaxError = fs.readFileSync(require.resolve('./fixtures-es6/program1/syntax-error.ts'), 'utf8');
const constEnums = fs.readFileSync(require.resolve('./fixtures-es6/program1/const-enums.ts'), 'utf8');
const trailingComma = fs.readFileSync(require.resolve('./fixtures-es6/es3/trailing-comma.ts'), 'utf8');

describe('Transpiler', () => {

   function transpile(sourceName, source, host?) {
      host = host || new CompilerHost({}); 
	   const transpiler = new Transpiler(host);
      host.addFile(sourceName, source);
      return transpiler.transpile(sourceName);
   }

   it('transpiles successfully', () => {
      const output = transpile('one-import.ts', oneImport);
      formatErrors(output.errors, console as any);
      output.should.have.property('failure', false);
      output.should.have.property('errors').with.lengthOf(0);
      output.should.have.property('js').with.lengthOf(322);
   });

   it('removes SourceMappingURL', () => {
      let output = transpile('one-import.ts', oneImport);
      output.js.should.not.contain("SourceMappingURL");
   });

   it('returns sourceMap', () => {
      let output = transpile('one-import.ts', oneImport);
      output.should.have.property('sourceMap').with.lengthOf(143);
   });

   it('catches syntax errors', () => {
      let output = transpile('syntax-error.ts', syntaxError);
      //formatErrors(output.errors, console as any);
      output.should.have.property('failure', true);
      output.should.have.property('errors').with.lengthOf(1);
   });

   it('catches configuation errors', () => {
      let options = {
         emitDecoratorMetadata: true,
         experimentalDecorators: false
      };
      let host = new CompilerHost(options);

      let output = transpile('one-import.ts', oneImport, host);
      //formatErrors(output.errors, console as any);
      output.should.have.property('failure', true);
      output.should.have.property('errors').with.lengthOf(1);
      output.errors[0].code.should.be.equal(5052);
   });

   it('overrides invalid config options', () => {
      let options = {
         noEmitOnError: true,
         out: "somefile.js",
         declaration: true,
         noLib: false
      };
      let host = new CompilerHost(options);

      let output = transpile('one-import.ts', oneImport, host);
      formatErrors(output.errors, console as any);
      output.should.have.property('failure', false);
      output.should.have.property('errors').with.lengthOf(0);
   });

   xit('errors on const enums', () => {
      let output = transpile('const-enums.ts', constEnums);
      //formatErrors(output.errors, console as any);
      output.should.have.property('failure', true);
      output.should.have.property('errors').with.lengthOf(1);
   });

   it('uses sourceMap option', () => {
      let options = {
         sourceMap: false
      };
      let host = new CompilerHost(options);
      let output = transpile('symbol.ts', es6Symbol, host);
      (output.sourceMap === undefined).should.be.true;
   });

   it('uses target option', () => {
      let host = new CompilerHost({
         target: "es3"
      });
      let es3output = transpile('trailing-comma.ts', trailingComma, host);

      host = new CompilerHost({
         target: "es5"
      });
      let es5output = transpile('trailing-comma.ts', trailingComma, host);
      es3output.should.not.be.equal(es5output);
   });
});
