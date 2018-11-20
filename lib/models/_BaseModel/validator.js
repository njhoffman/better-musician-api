const { pick, pickBy, omit, isObject, isUndefined, keys }  = require('lodash');
const validator = require('validator');
const { warn, error } = require('lib/utils/logger')('models:base:validator');

const valMap = {
  email:    validator.isEmail,
  number:   validator.isNumeric,
  url:      validator.isURL,
  bool:     validator.isBoolean,
  password: (str) => validator.isLength(str, { min: 6 })
};

function validateFields(modelFields, inFields) {
  // check existence of keys

  const vFields = pick(inFields, keys(this.tableKeys));
  let { warnings, errors } = this;
  // console.log("VALIDATE FIELDS", "\n\n1: ", inFields, "\n\n2: ", vFields, "\n\n3: ", keys(vFields), "\n\n 4:",  omit(inFields, keys(vFields)));
  keys(omit(inFields, keys(vFields), 'createdAt', 'updatedAt'))
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
    let curr = vFields[rf];
    if (!isObject(curr) && !isUndefined(curr)) {
      curr = curr.toString().trim();
    }

    if (this.status.creating && !curr) {
      errors.push({
        type: 'requiredField',
        field: rf,
        data: inFields,
        message: `${rf} is a required field for ${this.tableName}`
      });
    }
  });

  // validate fields
  keys(vFields).forEach(vfKey => {
    const fieldDef = this.tableKeys[vfKey];
    if (fieldDef.validate) {
      fieldDef.validate.forEach(type => {
        // validator only validates strings, throws errors for everything else
        // TODO: should we save everything as a string (no numbers), throw our own errors?
        const valResult = valMap[type](vFields[vfKey].toString());
        if (!valResult) {
          errors.push({
            type:    'validation',
            field:   vfKey,
            data:    inFields,
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
      warn(`Validation Warning: ${w.type} - "${w.field}"`);
      warn({ inFields }, `  -- ${w.message}`);
    });
  [].concat(errors).filter(Boolean)
    .forEach(e => {
      error(`Validation Error: ${e.type} - "${e.field}"`);
      error({ inFields }, `  -- ${e.message}`);
    });
  return vFields;
}

module.exports = validateFields;
