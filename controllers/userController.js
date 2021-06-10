exports.getAllUsers = (req, res) => {
  res
    .status(200)
    .json({ date: req.requestTime.toISOString(), status: 'from Users' });
};
exports.getUser = (req, res) => {
  res
    .status(200)
    .json({ date: req.requestTime.toISOString(), status: 'from Users' });
};

exports.createUser = (req, res) => {
  res
    .status(200)
    .json({ date: req.requestTime.toISOString(), status: 'from Users' });
};

exports.updateUser = (req, res) => {
  res
    .status(200)
    .json({ date: req.requestTime.toISOString(), status: 'from Users' });
};
exports.deleteUser = (req, res) => {
  res
    .status(200)
    .json({ date: req.requestTime.toISOString(), status: 'from Users' });
};
