const initialValues = {};

export function getInitialValue(cssSelector) {
  return initialValues[cssSelector];
}

export function setInitialValue(cssSelector, value) {
  initialValues[cssSelector] = value;
}

