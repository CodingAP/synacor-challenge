let permutator = array => {
    let result = [];

    const permute = (arr, m = []) => {
        if (arr.length === 0) {
            result.push(m)
        } else {
            for (let i = 0; i < arr.length; i++) {
                let curr = arr.slice();
                let next = curr.splice(i, 1);
                permute(curr.slice(), m.concat(next))
            }
        }
    }

    permute(array)

    return result;
}

let numbers = permutator([2, 3, 5, 7, 9]);

numbers.forEach(value => {
    let result = value[0] + value[1] * value[2] ** 2 + value[3] ** 3 - value[4];
    if (result == 399) console.log(value);
});