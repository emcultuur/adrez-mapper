/*
 *
 */

const FieldComposed = require('./field-composed').FieldComposed;
const FieldTextUrl = require('./field-text-url').FieldTextUrl;
const FieldText = require('./field-text').FieldText;

// ------
// default type of none is give. Can be set in the options by the DEFAULT_CODE_URL key
let DEFAULT_CODE_URL = 117;

class FieldUrl extends FieldComposed {
  constructor(options = {}) {
    super(options);
    if (options.DEFAULT_CODE_URL) {
      DEFAULT_CODE_URL = options.DEFAULT_CODE_URL;
    }
    this._fields.url = new FieldTextUrl({part: 'href'});
    // this._fields.href = new FieldTextUrl({part: 'href'});
    this._fields.hostPath = new FieldTextUrl({part: 'hostPath'});
    this._fields.origin = new FieldTextUrl({part: 'origin'});

    // convert the auto loaded urls in regex
    // textRegEx is the part that holds the name of the account
    this._urls = {
      Twitter: {
        url: new RegExp('twitter\.com'),
        typeId: 140,
        textRegEx: new RegExp('(?:https?:\\/\\/)?(?:www\\.)?twitter\\.com\\/(?:(?:\\w)*#!\\/)?(?:[\\w\\-]*\\/)*([\\w\\-\\.]*)')
     },
     Facebook: {
       url: new RegExp('facebook\.com'),
       typeId: 142,
       textRegEx: new RegExp('(?:https?:\\/\\/)?(?:www\\.)?facebook\\.com\\/(?:(?:\\w)*#!\\/)?(?:pages\\/)?(?:[\\w\\-]*\\/)*([\\w\\-\\.]*)')
     },
     LinkedIn: {
       url: new RegExp('linkedin\.com\/'),
       typeId: 143,
       // textRegEx: new RegExp('(?:https?:\\/\\/)?(?:www\\.)?linkedin.com(\\w+:{0,1}\\w*@)?(\\S+)(:([0-9])+)?(\\/|\\/([\\w#!:.?+=&%@!\\-\\/]))?')
       textRegEx: new RegExp('(?:https?:\\/\\/)?(?:www\\.)?linkedin\\.com\\/(?:(?:\\w)*#!\\/)?(?:in\\/)?(?:[\\w\\-]*\\/)*([\\w\\-\\.]*)')
     }
    };
    if (options.urls) {
      for (let l = 0; l < options.urls.length; l++) {
        try {
          this._urls[options.urls[l].name] = {
            url: new RegExp(options.urls[l].url),
            typeId: options.urls[l].typeId,
            textRegEx: options.urls[l].textRegEx ? new RegExp(options.urls[l].textRegEx) : false
          };
        } catch (e) {
          console.error('[url config]', e.message, 'link skipped', options.urls[l].url);
          this.log(options.logger, 'error', options.urls[l].name, e.message);
        }
      }
    }
    for (let name in this._urls) {
      if (!this._urls.hasOwnProperty(name)) { continue }
      this._fields[name] = new FieldText()
    }
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

    if (fields.value === undefined) {  // value overrules all
      if (fields.url) {
        data.value = await this._fields.url.convert(fieldName, data.url, logger)
      } else if (fields.href) {
        data.value = await this._fields.href.convert(fieldName, data.href, logger)
      } else if (fields.hostPath) {
        data.value = await this._fields.hostPath.convert(fieldName, data.hostPath, logger)
      } else if (fields.origin) {
        data.value = await this._fields.origin.convert(fieldName, data.origin, logger)
      }
    }
    let skipFields = ['url', 'href', 'hostPath', 'origin'];
    if (data.value && data.typeId === undefined) {
      // find the type of the url automatically if the user did not force it
      for (let name in this._urls) {
        if (! this._urls.hasOwnProperty(name)){ continue }
        if (data.value.match(this._urls[name].url)) {
          // default is typeId, but if not found, use the type
          if (this._urls[name].typeId) {
            data.typeId = this._urls[name].typeId;
          } else if (this._urls[name].type) {
            data.type = this._urls[name].type;
          }
          if (this._urls[name].textRegEx) {
            let v = data.value.match(this._urls[name].textRegEx);
            if (v !== null && v.length > 1) {
              data.value = v[1]
            }
          }
          break;
        }
      }
    } else if (data.value === undefined) {
      // load the direct field names like facebook, twitter, linkedIn
      for (let name in this._urls) {
        if (!this._urls.hasOwnProperty(name)) { continue }
        if (data[name]) {
          data.value = data[name];
          if (this._urls[name].typeId) {
            data.typeId = this._urls[name].typeId;
          } else if (this._urls[name].type) {
            data.type = this._urls[name].type;
          }
        }
        skipFields.push(name)
      }
    }
    if (!data.typeId) {
      data.typeId = DEFAULT_CODE_URL;
    }
    this.copyFieldsToResult(result, data, skipFields);
    let cFields = this.remapFields(result);
    return super.processKeys(fieldName, cFields, result, logger);
  }
}

module.exports.FieldUrl = FieldUrl;
