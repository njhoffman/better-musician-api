const { pick, pickBy, omit, isObject, isUndefined, keys }  = require('lodash');
const validator = require('validator');

const valMap = {
  email:    validator.isEmail,
  number:   validator.isNumeric,
  url:      validator.isURL,
  bool:     validator.isBoolean,
  password: (str) => validator.isLength(str, { min: 6 })
};

function validateFields(inFields) {
  // assign validation properties, check existence of keys
  // const vFields = pick(inFields, keys(omitBy(this.tableKeys, 'relation')));
  const vFields = pick(inFields, keys(this.tableKeys));
  const results = { warnings: [], errors: [], validated: vFields };

  keys(omit(inFields, keys(vFields), 'createdAt', 'updatedAt'))
    .forEach(badKey => {
      results.warnings.push({
        type: 'invalidField',
        field: badKey,
        message: `${badKey} was not found in tableKeys definition for table: ${this.tableName}`
      });
    });

  // check required fields
  const reqFields = omit(this.existingFields, pickBy(this.tableKeys, (tk) => (tk.required === true)));
  keys(reqFields).forEach(rf => {
    let curr = vFields[rf];
    if (!isObject(curr) && !isUndefined(curr)) {
      curr = curr.toString().trim();
    }

    if (!curr) {
      results.errors.push({
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
          results.errors.push({
            type:    'validation',
            field:   vfKey,
            data:    inFields,
            message: `${vfKey} failed validation for data: ${vFields[vfKey]}`
          });
          delete results.validated[vfKey];
        }
      });
    } else if (fieldDef.relation) {
      // validate foreign fields, allow direct id assign if flag iset
      if (isObject(vFields[vfKey])) {
        const Relation = fieldDef.relation.Model;
        const fModel = new Relation(vFields[vfKey]);
        results.warnings.push(...[].concat(fModel.warnings));
        results.errors.push(...[].concat(fModel.errors));
        if (fModel.errors) {
          delete vFields[vfKey];
        }
      }
    }
    // sanitize all data by escaping html entities
    // vFields[vfKey] = validator.escape(vFields[vfKey] + '');
  });

  return results;
}

module.exports = validateFields;
