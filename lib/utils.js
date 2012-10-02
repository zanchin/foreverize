var path = require('path');

// [M]ake abs [P]ath
function mp(relpath){
  var parent = process.cwd();
  return path.join( parent, relpath );
}

module.exports = exports = {
  mp: mp
}
