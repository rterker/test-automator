const initialValues = {};

export function getInitialValue(cssSelector) {
  console.log(`getInitialValue: initialValue for ${JSON.stringify(cssSelector, null, 2)} is ${initialValues[cssSelector]}`);
  return initialValues[cssSelector];
}

export function setInitialValue(cssSelector, value) {
  if (!initialValues[cssSelector]) {
    initialValues[cssSelector] = value;
  }
  console.log(`setInitialValue: initialValue for ${JSON.stringify(cssSelector, null, 2)} is ${value}`);
}

