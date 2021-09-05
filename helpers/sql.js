const { BadRequestError } = require("../expressError");

/** Write SQL for update of database.
 * 
 * dataToUpdate contains the new data for the database
 *     example: {firstName: 'Aliya', age: 32}
 * jsToSql includes key-value pairs of JS variable names and SQL variable names
 *      example: {'firstName': 'first_name'}
 * 
 * Returns
 *    setCols - a string which can be used to SET the column values using SQL and parameterized data
 *         example: "first_name=$1, age=$2"
 *    values - an array of the data values to be substituted in for the parameters 
 *         example: ['Aliya', 32]
 * 
 * Throws BadRequestError if no data in dataToUpdate
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/** Write SQL for filtering of results from database.
 * 
 * criteria contains the filtering criteria
 *      example: {minEmployees: 100, maxEmployees: 300}
 * 
 * Returns
 *    whereStr - a string which can be used to filter using WHERE in SQL and parameterized queries
 *         example: "WHERE num_employees>$1, num_employees<$2"
 *    values - an array of the data values to be substituted in for the parameters 
 *          example: [100, 300]]
 * 
 * Throws BadRequestError if criteria is empty
 */


 function sqlForFilter(criteria) {
  const keys = Object.keys(criteria);

  if (keys.length === 0) throw new BadRequestError("No filtering criteria");

  const criteriaStr = [];
  const values = [];

  let idx = 1;
  // {minEmployees: 100, maxEmployees: 300} => ['num_employees>$1', 'num_employees<$2']
  if (criteria.minEmployees) {
    criteriaStr.push(`num_employees>=$${idx}`);
    idx++;
    values.push(+criteria.minEmployees);
  }
  if (criteria.maxEmployees) {
    criteriaStr.push(`num_employees<=$${idx}`);
    idx++;
    values.push(+criteria.maxEmployees);
  }
  if (criteria.name) {
    criteriaStr.push(`name ILIKE $${idx}`);
    idx++;
    values.push(`%${criteria.name}%`);
  }

  return {
    whereStr: "WHERE " + criteriaStr.join(" AND "),
    values
  };
}

module.exports = { sqlForPartialUpdate, sqlForFilter };
