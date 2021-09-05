const { sqlForPartialUpdate, sqlForFilter } = require("./sql");
const { BadRequestError } = require("../expressError");
const { SECRET_KEY } = require("../config");


describe("sqlForPartialUpdate", function () {
  test("works", function () {
    const dataToUpdate = {firstName: "Aliya", age: 32};
    const jsToSql = {firstName: "first_name"};
    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(setCols).toEqual(`"first_name"=$1, "age"=$2`);
    expect(values).toEqual(["Aliya", 32]);
  });

  test("error if no data", async function () {
    try {
      const dataToUpdate = {};
      const jsToSql = {firstName: "first_name"};
      const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);    
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});


describe("sqlForFilter", function () {
  test("works for minEmployees", function () {
    const criteria = {minEmployees: "10"};
    const { whereStr, values } = sqlForFilter(criteria);

    expect(whereStr).toEqual(`num_employees>=$1`);
    expect(values).toEqual([10]);
  });

  test("works for maxEmployees", function () {
    const criteria = {maxEmployees: "10"};
    const { whereStr, values } = sqlForFilter(criteria);

    expect(whereStr).toEqual(`num_employees<=$1`);
    expect(values).toEqual([10]);
  });

  test("works for minEmployees and maxEmployees", function () {
    const criteria = {minEmployees: "10", maxEmployees: "100"};
    const { whereStr, values } = sqlForFilter(criteria);

    expect(whereStr).toEqual(`num_employees>=$1 AND num_employees<=$2`);
    expect(values).toEqual([10, 100]);
  });

  test("works for name", function () {
    const criteria = {name: "ok"};
    const { whereStr, values } = sqlForFilter(criteria);

    expect(whereStr).toEqual(`name ILIKE $1`);
    expect(values).toEqual(['%ok%']);
  });

  test("error if no criteria", async function () {
    try {
      const criteria = {};
      const { whereStr, values } = sqlForFilter(criteria);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
  
  test("error if minEmployees > maxEmployees", async function () {
    try {
      const criteria = {minEmployees: "100", maxEmployees: "10"};
      const { whereStr, values } = sqlForFilter(criteria);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});