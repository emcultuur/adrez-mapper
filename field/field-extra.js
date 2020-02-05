

const FieldGuid = require('./field-text').FieldTextGuid;
const FieldObject = require('./field-object').FieldObject;
const FieldText = require('./field-text').FieldText;
const FieldBoolean = require('./field-text-boolean').FieldTextBoolean;
const FieldNumber = require('./field-text-number').FieldTextNumber;
const FieldDate = require('./field-text-date').FieldTextDate;

class FieldExtra extends FieldObject {
  constructor(options) {
    super(options);
    this.emptyValueAllowed = true;
    this.lookupFunctionName = 'extra';
    // 201 is wrong value but there is no default extra field.
    this.baseTypeId = options.baseTypeId !== undefined ? options.baseTypeId : 201;

    this._controlTypes = {
      boolean: new FieldBoolean(),
      text: new FieldText(),
      number: new FieldNumber(),
      date: new FieldDate(),
    };
    this._fieldDef = {
      text: {
        fieldName: 'text',
        fieldTypeGuid: 'ADREZ_FIELD_STRING',
        fieldTypeId: 201,
        field: this._controlTypes.text,
        skip: false  // field should remain in the result
      },
      description: {
        fieldName: 'description',
        fieldTypeGuid: 'ADREZ_FIELD_MEMO',
        fieldTypeId: 206,
        field: this._controlTypes.text,
        skip: false  // field should remain in the result
      },
      boolean: {
        fieldName: 'text',
        fieldTypeGuid: 'ADREZ_FIELD_BOOLEAN',
        field: this._controlTypes.boolean
      },
      number: {
        fieldName: 'text',
        fieldTypeGuid: 'ADREZ_FIELD_INTEGER',
        field: this._controlTypes.number
      },
      date: {
        fieldName: 'text',
        fieldTypeGuid: 'ADREZ_FIELD_DATE',
        field: this._controlTypes.date
      },
      dateTime: {
        fieldName: 'text',
        fieldTypeGuid: 'ADREZ_FIELD_DATETIME',
        field: this._controlTypes.date
      },
      money: {
        fieldName: 'text',
        fieldTypeGuid: 'ADREZ_FIELD_MONEY',
        field: this._controlTypes.text
      },
      list: {
        fieldName: 'description',
        fieldTypeGuid: 'ADREZ_FIELD_LIST',
        field: this._controlTypes.text
      },
      image: {
        fieldName: 'text',
        fieldTypeGuid: 'ADREZ_FIELD_IMAGE',
        field: this._controlTypes.text
      },
      multi: {
        fieldName: 'description',
        fieldTypeGuid: 'ADREZ_FIELD_MULTI',
        field: this._controlTypes.text
      },
    };
    this._skipFields = [];
    for (let name in this._fieldDef) {
      if (!this._fieldDef.hasOwnProperty(name)) { continue }
      this._fields[name] = this._fieldDef[name].field;
      if (this._fieldDef[name].skip === undefined || this._fieldDef[name].skip) {
        this._skipFields.push(name);
      }
    }

//
//     this._fields.text = new FieldText();
//     this._fields.boolean = new FieldBoolean();
//     this._fields.description = new FieldText();
//     this._fields.number = new FieldNumber();
// //    this._fields.groupId = new FieldGuid();
//     this._fields.date = new FieldDate();
//     this._fields.dateTime = new FieldDate();
//     this._fields.money = new FieldText();
//     // ToDo create some component for these types
//     this._fields.list = new FieldText();
//     this._fields.multi = new FieldText();
//     this._fields.image = new FieldText();
//
//     // -- specials
//     // the 'memo', text, etc to translate in the
//     this._fields.fieldType = new FieldText();
//     this._fields.fieldTypeId = new FieldText();
  }

  /**
   * read only the field that are filled
   * @param fieldName
   * @param fields
   * @param data
   * @param logger
   * @returns {Promise<void>}
   */
  async processKeys(fieldName, fields, data, logger) {
    let result = {};
    // find the first occurence of an type
    for (let name in this._fieldDef) {
      if (!this._fieldDef.hasOwnProperty(name)) {
        continue
      }
      if (fields[name] && data[name] !== undefined) {
        // found the field
        result[this._fieldDef[name].fieldName] = await this._fields[name].convert(fieldName, data[name], logger);
        result.fieldTypeGuid = this._fieldDef[name].fieldTypeGuid;
        result.fieldTypeId = this._fieldDef[name].fieldTypeId;
        break;
      }
    }
    if (Object.keys(result).length === 0) {
      // did not find any value
      return Promise.resolve({})
    }

    // if (fields.boolean) {
    //   result.text = await this._fields.boolean.convert(fieldName, data.boolean, logger) ? '1' : '0';
    //   result.fieldType = 'boolean';
    // } else if (fields.description) {
    //   result.description = await this._fields.description.convert(fieldName, data.description, logger);
    //   result.fieldType = 'memo';
    // } else if (fields.text) {
    //   result.text = await this._fields.text.convert(fieldName, data.text, logger);
    //   result.fieldType = 'string';
    // } else if (fields.number) {
    //   result.text = await this._fields.number.convert(fieldName, data.number, logger);
    //   result.fieldType = 'integer';
    // } else if (fields.date) {
    //   result.text = await this._fields.date.convert(fieldName, data.date, logger);
    //   result.fieldType = 'date';
    // } else if (fields.dateTime) {
    //   result.text = await this._fields.dateTime.convert(fieldName, data.dateTime, logger);
    //   result.fieldType = 'dateTime';
    // } else if (fields.money) {
    //   result.text = await this._fields.money.convert(fieldName, data.money, logger);
    //   result.fieldType = 'money';
    // } else if (fields.list) {
    //   result.text = await this._fields.list.convert(fieldName, data.list, logger);
    //   result.fieldType = 'list';
    // } else if (fields.image) {
    //   result.text = await this._fields.image.convert(fieldName, data.image, logger);
    //   result.fieldType = 'image';
    // } else if (fields.multi) {
    //   result.text = await this._fields.multi.convert(fieldName, data.multi, logger);
    //   result.fieldType = 'multi';
    // } else {
    //   this.log(logger, 'warn',fieldName, 'no data found')
    // }
    // overrule the type given by the automatic handler
    // if (data.fieldType) {
    //   result.fieldType = data.fieldType;
    // }

    this.copyFieldsToResult(result, data, this._skipFields);
    let cFields = this.remapFields(result);
    return super.processKeys(fieldName, cFields, result, logger).then( (aws) => {
      this.copyFieldsToResult(result, aws, ['fieldTypeGuid', 'fieldTypeId'])
      return result
    });
  }
}

module.exports.FieldExtra = FieldExtra;
