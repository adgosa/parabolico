var ghpages = require("gh-pages");

ghpages.publish(
    "public", // path to public directory
    {
        branch: "gh-pages",
        repo: "https://github.com/adgosa/parabolico.git", // Update to point to your repository
        user: {
            name: "adgosa", // update to use your name
            email: "email", // Update to use your email
        },
    },
    () => {
        console.log("Deploy Complete!");
    }
);
