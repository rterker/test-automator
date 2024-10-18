export function errorHandler(file, location, error) {
  return console.log(`${file}: error occured in ${location}: ${error}`);
}