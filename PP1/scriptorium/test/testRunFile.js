const { runFile, fileEnd } = require("../lib/code-run.js");

const basicTests = [
    { lang: "javascript", code: "console.log(\"JavaScript File\");" },
    { lang: "python", code: "print(\"Python File\")" },
    { lang: "java", code: "public class file { public static void main(String[] args) { System.out.println(\"Java File\"); } }" },
    { lang: "c", code: "#include <stdio.h>\nint main() { printf(\"C File\\n\"); return 0; }" },
    { lang: "c++", code: "#include <iostream>\nint main() { std::cout << \"C++ File\" << std::endl; return 0; }" }
];

const inputTests = [
    { lang: "javascript", code: "const readline = require('node:readline');\
        const rl = readline.createInterface({ \
            input: process.stdin,\
            output: process.stdout,\
        });\
        rl.question(\"\", user_input => { \
            console.log(user_input);\
            rl.close();\
        });", input: ["JavaScript Input"] },
    { lang: "python", code: "user_input = input()\nprint(user_input)", input: ["Python Input"] },
    { lang: "java", code: "import java.util.Scanner; class file { public static void main(String[] args) { \
        Scanner scanner = new Scanner(System.in); \
        String user_input = scanner.nextLine(); \
        System.out.println(user_input); } }", input: ["Java Input"] },
    { lang: "c", code: "#include <stdio.h>\nint main() { \
        char user_input[20]; \
        fgets(user_input, 20, stdin); \
        printf(\"%s\", user_input); \
        return 0; }", input: ["C Input"] },
    { lang: "c++", code: "#include <iostream>\n#include <string>\nint main() { \
        std::string user_input; \
        std::getline(std::cin, user_input); \
        std::cout << user_input << std::endl; \
        return 0; }", input: ["C++ Input"] }
];

async function runTests() {
    // general function for testing the code-run.js file without an API call
    console.log("Basic Tests:\n");

    for (const test of basicTests) {
        try {
            const [ status, output, error ] = await runFile(test.lang, test.code);

            console.log(test.lang + " Basic Test");
            console.log("Status: " + status);
            console.log("Output: " + output);
            console.log("-------------------");


        } catch (error) {
            console.error(error.message);
        }
    }

    console.log("Input Tests:\n");

    for (const test of inputTests) {
        try {
            const [ status, output, error ] = await runFile(test.lang, test.code, test.input);

            console.log(test.lang + " Basic Test");
            console.log("Status: " + status);
            console.log("Output: " + output);
            console.log("-------------------");


        } catch (error) {
            console.error(error.message);
        }
    }
}

function testEndFile() {
    console.log("Testing fileEnd function:\n")
    console.log("JavaScript: " + fileEnd("javascript"));
    console.log("Python: " + fileEnd("python"));
    console.log("Java: " + fileEnd("java"));
    console.log("C: " + fileEnd("c"));
    console.log("C++: " + fileEnd("c++") + "\n");
}

runTests();
testEndFile();