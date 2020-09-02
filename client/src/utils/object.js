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
