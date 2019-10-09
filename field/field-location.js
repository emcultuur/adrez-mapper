/**
 * Field Location
 */

const FieldText = require('./field-text').FieldText;
const FieldGuid = require('./field-text').FieldGuid;

// const FieldObject = require('./field-object').FieldObject;
const FieldComposed = require('./field-composed').FieldComposed;
const FieldZipcode = require('./field-text-zipcode').FieldTextZipcode;


class FieldLocation extends FieldComposed {

  constructor(options = {}) {
    super(options);
    // this._fields = {
    //   type: new FieldText(),        // the name of the code
    //   typeId: new FieldGuid(),      // the id, overrules the type

    this._fields.street = new FieldText();
    this._fields.number = new FieldText();
    this._fields.suffix = new FieldText();
    this._fields.streetNumber = new FieldText();
    this._fields.zipcode = new FieldZipcode(options);
    this._fields.city = new FieldText();
    this._fields.country = new FieldText({emptyAllow: true});
    this._fields.countryId = new FieldGuid({emptyAllow: true});
    delete this._fields.value;

      // _source: new FieldText({ emptyAllow: true }),      // the ref to only update our own info
    // }
  }

  /**
   * just process all keys individual
   *
   * @param fieldName
   * @param fields the field parsers
   * @param data the data given
   * @param logger Class where to store the errors
   */
  async processKeys(fieldName, fields, data, logger) {
    let result = {};
    let lookup = false;

    if (!data.countryId) {
      if  (data.country) {
        data.countryId = await this.lookup.country(fieldName, data.country, false, data)
      } else if (data.zipcode) {
        result.countryId = await this._fields.zipcode.countryId(data.zipcode, false);
        if (result.countryId === false) {
          let countryId = await this.lookup.zipcode2Country(fieldName, data.zipcode, 0, data);
        }
      }
    }

    let countryNumberRight = await this.lookup.countryStreetNumberRight(fieldName, data.countryId, true, data);

    // streetNumber can be split if street and number do NOT exist
    if (data.street === undefined || data.number === undefined) {
      if (data.streetNumber) {
        if (countryNumberRight) {
          // ToDo: better implementation: https://www.rosettacode.org/wiki/Separate_the_house_number_from_the_street_name
          const re = /^(\d*[\wäöüß\d '\-\.]+)[,\s]+(\d+)\s*([\wäöüß\d\-\/]*)$/i;
          let match = data.streetNumber.match(re);
          if (match) {
            match.shift(); // verwijder element 0=het hele item
            //match is nu altijd een array van 3 items
            data.street = match[0].trim();
            data.number = match[1].trim();
            data.suffix = match[2].trim();
          } else {
            this.log(logger, 'warn', fieldName + '.streetNumber', `can not parse: "${data.streetNumber}"`);
            data.street = field.data.streetNumber;
          }
        } else {
          // we do not parse other formats
          data.street = data.streetNumber;
        }
      }
    }

    if (data.zipcode && !data.street) {
      // do a lookup on zipcode for nl && b
      data.street = await this.lookup.street(fieldName, { zipcode: data.zipcode, number: data.number, countryId: data.countryId}, undefined, data)
    }
    if (!data.zipcode && (data.street && data.number && data.city)) {
      data.zipcode = await this.lookup.zipcode(fieldName, { street: data.street, number: data.number, city: data.city, countryId: data.countryId}, undefined, data)
    }

    this.copyFieldsToResult(result, data, ['country', 'streetNumber']);

    let cFields = this.remapFields(result);
    return super.processKeys(fieldName, cFields, result, logger);
  }

}

module.exports.FieldLocation = FieldLocation;
