let animalsArray = {

  let animals = [
    { type: "Dog", name: "Fluffy" },
    { type: "Dog", name: "Troy" },
    { type: "Dog", name: "Bart" },
    { type: "Cat", name: "Charlie" },
    { type: "Cat", name: "Missy" },
    { type: "Cat", name: "Ozzie" }
  ]

  let function myHOFilter(callback) {

  }

};

function myLongFilter(arr) {
  let newArr = new Array();
  arr.forEach(animal => {
    if (animal.type === "Dog") {
      newArr.push(animal);
    }
  });
  return newArr;
}
// console.log(myLongFilter(animals));


console.log(myHOFilter({animal, animals}))


// console.log(animals.filter(animal => animal.type == "Dog"));
