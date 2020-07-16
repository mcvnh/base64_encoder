const uncurry = fn => (...args) => {
  // reverse the arguments, and for each one
  const result = args.reduce((prevResult, arg) => { // as long as the previous result is a function, call it with the argument
    if (typeof prevResult === 'function') {
      return prevResult(arg);
    }

    // otherwise, return the result
    return prevResult;
  }, fn); // initialize the result with the function

  return typeof result === 'function' ? uncurry(result) : result;
};

const curry = (fn, length = fn.length) => (...args) => {
  if (args.length >= length) {
    return fn(...args);
  }

  return curry(
    (...nextArgs) => fn(...args, ...nextArgs),
    fn.length - args.length
  );
}

const add5 = a => a + 5;
const x2 = a => a * 2;

const compose = (f1, f2) => arg => f1(f2(arg));

const add5ThenX2 = compose(x2, add5);

/*
console.log(add5ThenX2(2));

const add = uncurry(a => b => c => a + b + c);

console.log(add(1)(2)(3));
console.log(add(1, 2)(3));
console.log(add(1)(2, 3));
console.log(add(1, 2, 3));

const add2 = curry((a, b, c) => a + b + c);
console.log(add2(1)(2)(3));
console.log(add2(1, 2)(3));
console.log(add2(1)(2, 3));
console.log(add2(1, 2, 3));
*/

const NumberBox = number => ({
  map: fn => {
    if (typeof number !== 'number') {
      return NumberBox(NaN);
    }

    return NumberBox(fn(number));
  },
  value: number,
});

console.log(NumberBox(5).map(v => v * 2).value);
console.log(NumberBox({v: 5}).map(v => v * 2).map(v => v + 1).value);

const TypeBox = (predicate, defaultValue) => {
  const TypePredicate = value => ({
    map: fn => predicate(value) ? TypePredicate(fn(value)) : TypePredicate(defaultValue),
    value,
  });

  return TypePredicate;
}

// const NumberBox = TypeBox(value => typeof value === 'number', NaN);
const StringBox = TypeBox(value => typeof value === 'string', null);

console.log(StringBox("world").map(v => "Hello " + v).value);
console.log(NumberBox(5) == NumberBox(5));

const isNothing = value => value === null || typeof value === 'undefined';
const Maybe = value => ({
  map: fn => isNothing(value) ? Maybe(null) : Maybe(fn(value)),
  getOrElse: defaultValue => isNothing(value) ? defaultValue : value,
  flatten: () => isNothing(value) ? Maybe(null) : Maybe(value.value),
});

const user = {
  name: "Holmes",
  address: { street: "Baker Street", number: "221B" },
};

const get = key => value => value[key];

console.log(
  Maybe(user)
    .map(get("address"))
    .map(get("street"))
    .getOrElse("hello world")
);

const Right = value => ({
  map: fn => Right(fn(value)),
  catch: () => Right(value),
  value,
})

const Left = value => ({
  map: fn => Left(value),
  catch: fn => Right(fn(value)),
  value,
});

console.log(Left(new Error("boom")).catch(error => error.message).value);

const tryCatch =fn => value => {
  try {
    return Right(fn(value));
  } catch (error) {
    return Left(error);
  }
}

const validateEmail = tryCatch(value => {
  if (!value.match(/\S+@\S+\.\S+/)) {
    throw new Error("The given email is invalid");
  }
  return value;
});


const validateUser = user =>
  Maybe({ name: 'adf' })
    .map(get("email"))
    .map(v => validateEmail(v).catch(get("message")))
    .flatten()
    .getOrElse("The user has no mail");

console.log(validateUser({
  firstName: 'John',
  email:'foo@example'
}));
