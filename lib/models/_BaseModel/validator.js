const { pick, pickBy, omit, isObject, keys }  = require('lodash');
const validator = require('validator');
const { warn, error } = require('lib/utils/logger')('api:BaseModel:validator');

function validateFields(fields) {
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
    });

  // check required fields
  const reqFields = pickBy(this.tableKeys, (tk) => (tk.required === true));
  keys(reqFields).forEach(rf => {
    const curr = isObject(vFields[rf])
      ? vFields[rf]
      : vFields[rf].toString().trim();

    if (!Object.prototype.hasOwnProperty.call(vFields, rf) || !curr) {
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
      fieldDef.validate.forEach(type => {
        const valMap = {
          email:    validator.isEmail,
          number:   validator.isNumeric,
          url:      validator.isURL,
          bool:     validator.isBoolean,
          password: (str) => validator.isLength(str, { min: 6 })
        };
        // validator only validates strings, throws errors for everything else
        // TODO: should we save everything as a string (no numbers), throw our own errors?
        const valResult = valMap[type](vFields[vfKey].toString());
        if (!valResult) {
          errors.push({
            type: 'validation',
            field: vfKey,
            message: `${vfKey} failed validation for data: ${vFields[vfKey]}`
          });
          delete vFields[vfKey];
        }
      });
    } else if (fieldDef.relation && !fieldDef.relation.reverse) {
      // validate foreign fields, allow direct id assign if flag iset
      if (!(fieldDef.relation.allowId && !isObject(vFields[vfKey]))) {
        const Relation = fieldDef.relation.Model;
        const fModel = new Relation(vFields[vfKey]);
        warnings = [...warnings, ...fModel.warnings];
        errors = [...errors, ...fModel.errors];
        if (fModel.errors.length !== 0) {
          delete vFields[vfKey];
        }
      }
    }
    // sanitize all data by escaping html entities
    // vFields[vfKey] = validator.escape(vFields[vfKey] + '');
  });
  [].concat(warnings).filter(Boolean)
    .forEach(w => {
      warn(`Validation Warning - ${w.type} for "${w.field}"`);
      warn(`  -- ${w.message}`);
    });
  [].concat(errors).filter(Boolean)
    .forEach(e => {
      error(`Validation Error - ${e.type} for "${e.field}"`);
      error(`  -- ${e.message}`);
    });
  return vFields;
}

module.exports = validateFields;
