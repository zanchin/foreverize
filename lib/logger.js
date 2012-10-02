var slice = Array.prototype.slice;

var slog = function(){
  var args = slice.call(arguments);
  var prepend = new Date() + " {" + process.pid + "}";
  args.splice(0, 0, prepend);  // insert
  console.log.call(this, args.join(" "));
};

module.exports = {
  slog: slog
};
