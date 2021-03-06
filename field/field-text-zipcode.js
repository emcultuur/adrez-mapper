/**
 * Field text. Does not do any conversion
 */

const FieldText = require('./field-text').FieldText;
// const Countries = require('../lib/lookup').Countries

const CODE_UNDEFINED = 0;
const CODE_NL = 500;
const CODE_BE = 501;
const CODE_GB = 502;
const CODE_F  = 503;
const CODE_D  = 504;
const CODE_L  = 600;
const CODE_US = 686;

const Countries = {
  unknown: CODE_UNDEFINED,
  nl : CODE_NL,
  be : CODE_BE,
  de : CODE_D,
  gb : CODE_GB,
  lu : CODE_L,
  fr : CODE_F,
  us : CODE_US,
  unknown: 0
};

class FieldTextZipcode extends FieldText {
  constructor(options = {}){
    super(options);
    this._name = 'zipcode';
  }

  /**
   *
   * @param code string
   */
  value(code) {
    if (code !== undefined) {
      let upper = code.toUpperCase();
      if (upper.substr(0,2) === 'B-') {
        return code.substr(2);
      } else if (upper.substr(0, 1) === 'B') {
        return code.substr(1).trim();
      } else {
        return code;
      }
    }
    return code;
  }

  async countryId(code) {
    if (typeof code === 'string') {
      let upper = code.toUpperCase();
      if (upper.substr(0, 2) === 'B-' || upper.substr(0, 1) === 'B') {
        return Countries.be
      }
      // http://html5pattern.com/Postal_Codes
      if (code.match(/^[1-9][0-9]{3}\s?[a-zA-Z]{2}$/)) {
        return Countries.nl
      }
      if (code.match(/^[0-9]{5}$/)) {
        return Countries.de
      }
      if (code.match(/^(L\s*(-|—|–))\s*?[\d]{4}$/)) {
        return Countries.lu
      }
      if (code.match(/^[A-Za-z]{1,2}[0-9Rr][0-9A-Za-z]? [0-9][ABD-HJLNP-UW-Zabd-hjlnp-uw-z]{2}$/)) {
        return Countries.gb
      }
      if (code.match(/^(\d{5}([\-]\d{4})?)$/)) {
        return Countries.us
      }
    }
    return false;
  }

}
module.exports.FieldTextZipcode = FieldTextZipcode;
module.exports.Countries = Countries;



