# ghost-of-tsukushima

A reusable authentication module and for reference

**Use case**: Authorize access to profile information and files.

## List of contributers :

- Abhishek Deyol (@everrover)
- Anurag Deyol (@anCoderr)

## API's

The end-points are named intuitively. And respectively present in their route files. There are three kinds of routes.

- **Files** - Handles file handling - ```/api/v1/files```
- **Profile** - Handles user profile access information - ```/api/v1/user```
- **Profile** - Handles user authentication and authorization - ```/api/v1/auth```

## Getting started steps

Install dependencies
```shell
npm install
```

Run server command
```shell
npm run dev
```

Import API's into postman using collection - file : ```GoT.postman_collection.json```

Import API env variables into postman using environment - file : ```GoT.postman_environment.json```

---

If you have some enhancements, bug corrections or any feasible changes in mind, do make a pull request.

Some future enhancements that I have in mind are listed below. Something catch your eye? Contact me for details.

## Enhancements

- Password recovery feature
- CRON jobs for weeding out deleted accounts, tokens, profiles and files.
- UI to intuitively handle the API's as they should be
- Profile uploads encryption, compression and setup
- Configuration setup to be done properly
- Making mails a bit beautiful

