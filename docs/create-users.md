# Create various user's

## Employees of a company

Create employee 1:
```
curl -H "Content-Type: application/json" -X POST -d @users/some-org-emp-1.json http://localhost:3200/cdp-defra-id-stub/API/register
```

Create employee 2:
```
curl -H "Content-Type: application/json" -X POST -d @users/some-org-emp-2.json http://localhost:3200/cdp-defra-id-stub/API/register
```
