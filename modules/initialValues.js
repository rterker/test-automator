const initialValues = {};

//TODO: reset initialValues object for new recordings
export function getInitialValue(cssSelector) {
  console.log(`getInitialValue: initial value for ${JSON.stringify(cssSelector, null, 2)} is ${initialValues[cssSelector]}`);
  return initialValues[cssSelector];
}

export function setInitialValue(cssSelector, value) {
  if (!initialValues[cssSelector]) {
    initialValues[cssSelector] = value;
  }
  console.log(`setInitialValue: initial value for ${JSON.stringify(cssSelector, null, 2)} set to ${value}`);
}

