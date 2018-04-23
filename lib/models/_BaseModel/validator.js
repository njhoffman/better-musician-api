const { pick, pickBy, omit, isObject, keys }  = require('lodash');
const validator = require('validator');
const { warn, error} = require('../../utils/logger')('api:BaseModel:validator');

const validateFields = function(fields) {
  // check existence of keys
  const vFields = pick(fields, keys(this.tableKeys));
  let { warnings, errors } = this;
  keys(omit(fields, keys(vFields)))
    .forEach(badKey => {
      warnings.push({
        type: 'invalidField',
        field: badKey,
        message: `${badKey} was not found in tableKeys definition for table: ${this.tableName}`
      });
    })

  // check required fields
  const reqFields = pickBy(this.tableKeys, (tk) => (tk.required === true));
  keys(reqFields).forEach(rf => {
    if (!vFields.hasOwnProperty(rf) ||
      (!isObject(vFields[rf]) && (vFields[rf] + '').trim() === '')) {
      errors.push({
        type: 'requiredField',
        field: rf,
        message: `${rf} is a required field for ${this.tableName}`,

      });
    }
  });

  // validate fields
  keys(vFields).forEach(vfKey => {
    const fieldDef = this.tableKeys[vfKey];
    if (fieldDef.validate) {
      fieldDef.validate.forEach(vTerm => {
        const valMap = {
          'email' : validator.isEmail,
          'number' : validator.isNumeric,
          'url' : validator.isURL,
          'bool' : validator.isBoolean,
          'password' : (str) => {
            return validator.isLength(str, { min: 6 });
          }
        };
        const valResult = valMap[vTerm](vFields[vfKey] + '');
        if (!valResult) {
          errors.push({
            type: 'validation',
            field: vf,
            message: `${vfKey} failed ${vf} validation for data: ${vFields[vfKey]}`
          });
          delete vFields[vfKey];
        }
      });
    } else if(fieldDef.relation && !fieldDef.relation.reverse) {
      // validate foreign fields, allow direct id assign if flag iset
      if (!(fieldDef.relation.allowId &&  !isObject(vFields[vfKey]))) {
        const fModel = new fieldDef.relation.model(vFields[vfKey]);
        warnings = { ...warnings, ...fModel.warnings };
        errors = { ...errors, ...fModel.errors };
        if (fModel.errors.length !== 0) {
          delete vFields[vfKey];
        }
      }
    }
    // sanitize all data by escaping html entities
    // vFields[vfKey] = validator.escape(vFields[vfKey] + '');
  });
  warnings.length > 0 && warn('warnings', warnings);
  errors.length > 0 && warn('errors', errors);
  return vFields;
}

module.exports = exports = validateFields;
