class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  //Filtering
  filter() {
    let queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    //advanced filtering gt gte lt lte ne eq in nin
    const queryString = JSON.stringify(queryObj);

    //use regular expression to add $ to the filter
    queryObj = JSON.parse(
      queryString.replace(
        /\b(gte|gt|lte|lt|ne|eq|in|nin)\b/g,
        (match) => `$${match}`
      )
    );
    this.query = this.query.find(queryObj);
    return this;
  }

  //sorting
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  //Fields selecting
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); //removing the field __v
    }

    return this;
  }

  //pagination
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100; //number of results each page contains
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = APIFeatures;
