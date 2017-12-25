module.exports = function(code) {
    return new Promise((resolve, reject) => {
        const {NodeVM} = require('vm2');
        
        const vm = new NodeVM({
            console: 'inherit',
            sandbox: {},
            require: {
                root: "./"
            }
        });
        
        let req = vm.run(code);
        resolve(req == "I have completed part A! ;)");
    });
}