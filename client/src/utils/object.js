export const mapObjectProps = (o, f) => {
  const m = {};
  Object.keys(o).forEach((key) => {
    const value = o[key];
    if (Array.isArray(value)) {
      m[key] = value.map((item) => {
        const itemObj = {};
        Object.keys(item).forEach((key) => itemObj[key] = f());
        return itemObj;
      });
    } else {
      m[key] = f();
    }
  });
  return m;
};
// Input string and update function. 
// Will only update if the text has no spaces in it. 
export const updateWithoutWhiteSpace = (str, fn )=>{
  let trimmed = str.trim();
  if(trimmed===str){
    fn(trimmed);
  }
}
