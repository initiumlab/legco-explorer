module.exports = {
  "extends": "google",
  "rules":{
    camelcase: ["error", {properties: "never"}],
    "quote-props": [0],
    'no-unused-vars': [1],
    'no-implicit-coercion': [0],
    'new-cap': [0],
    'max-len': [1,100],
    'no-unused-expressions':[0],
    'require-jsdoc':[0],
    'camelcase':[0],
    'valid-jsdoc':[0]
  },
  "globals": {
    "it": true,
    "describe": true,
    "expect": true,
    "_": true,
    "$": true
  }
}
