// Test password validation patterns

const testPasswords = [
    "@Sinak.21com",
    "password123",
    "Password1",
    "Pass@123",
    "12345678",
    "abcdefgh",
    "Abc123",
    "MyP@ssw0rd!",
    "Test.123",
    "user@domain.com"
];

// Old restrictive pattern (only letters and digits)
const oldPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

// New flexible pattern (allows special characters)
const newPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

console.log("🔍 Testing Password Validation Patterns\n");

console.log("Password".padEnd(20) + "Old Pattern".padEnd(15) + "New Pattern");
console.log("-".repeat(50));

testPasswords.forEach(password => {
    const oldResult = oldPattern.test(password) ? "✅ Valid" : "❌ Invalid";
    const newResult = newPattern.test(password) ? "✅ Valid" : "❌ Invalid";
    
    console.log(
        password.padEnd(20) + 
        oldResult.padEnd(15) + 
        newResult
    );
});

console.log("\n📝 Pattern Explanations:");
console.log("Old Pattern: ^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$");
console.log("  - Requires at least one letter");
console.log("  - Requires at least one digit");
console.log("  - Only allows letters and digits (no special characters)");
console.log("  - Minimum 8 characters");

console.log("\nNew Pattern: ^(?=.*[A-Za-z])(?=.*\\d).{8,}$");
console.log("  - Requires at least one letter");
console.log("  - Requires at least one digit");
console.log("  - Allows any characters (including special characters)");
console.log("  - Minimum 8 characters");

console.log("\n🎯 Your password '@Sinak.21com' analysis:");
const yourPassword = "@Sinak.21com";
console.log(`Length: ${yourPassword.length} characters`);
console.log(`Has letters: ${/[A-Za-z]/.test(yourPassword) ? "✅ Yes" : "❌ No"}`);
console.log(`Has digits: ${/\d/.test(yourPassword) ? "✅ Yes" : "❌ No"}`);
console.log(`Has special chars: ${/[^A-Za-z\d]/.test(yourPassword) ? "✅ Yes (@, .)" : "❌ No"}`);
console.log(`Old pattern result: ${oldPattern.test(yourPassword) ? "✅ Valid" : "❌ Invalid"}`);
console.log(`New pattern result: ${newPattern.test(yourPassword) ? "✅ Valid" : "❌ Invalid"}`);
