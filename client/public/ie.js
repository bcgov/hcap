function get_browser() {
  var ua = navigator.userAgent, M = ua.match(/(msie|trident)\s*/i) || [];
  if (/trident/i.test(M[1])) {
    return { name: 'IE' };
  }
  return {
    name: M[1]
  };
}
var browser = get_browser();
window.onload = function() {
  if (browser.name === "MSIE" || browser.name === "IE" ) {
    var tag = document.createElement("p");
    tag.id = 'ie-browser';
    tag.textContent="This form does not work on Internet Explorer. Please consider using Google Chrome or Firefox instead.";
    document.body.appendChild(tag);

    var style = document.createElement('style');
    style.innerHTML = '#ie-browser { background-color: #fff4e5; color: #663c00; padding: 2rem; font-weight: bold; font-size: 16px; position: absolute; top: 0px; width: 100%; margin: 0; text-align: center; border-bottom: solid 2px #663c00; }';
    document.head.appendChild(style);
  }
}
