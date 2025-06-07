# this document is the development plan for making future changes to this project.

## feature requests i have

we should go step by step through these feature requests and come up with solutions to each one 

1. business logic changes for balance changes and points spending

 - when i create an account on an example date (6/5/2025), i specify a points balance (let's say 10,000 points).
 - then i realize i want to log some 40,000 points i spent in the past (before 6/5/2025), lets say 3/1/2025.
 - right now, the error message says i can't modify the balance, because the balance on that date was $0 (which is right), but i created the account balance as of "today" but the account always has some historical context.
 - instead of that, in the error message you can either "cancel" or "continue" wwhen you want to add that transaction
 - what happens then is: 
  - we create a balance update (we add the amount the user specifies that they spent to the next most recent balance (in this case 6/5/2025) and make an initial balance update at the day before 3/1/2025, so (2/28/2025) of 10,000 + the points that we are about to spent). we will call this "balance adjustment".
  - then we create a points spent transaction of the difference. so the current balance still stays the same, but the historical balances are fixed appropriately.
- i should be able to "delete" and edit transactions from the points spending table too, including transaction details, name, date, etc.



2. Calendar changes when making Balance Change (inside account details)
 - Make Calendar more Year picker friendly, than day picker friendly.
 - When a user loads the calendar, right now it shows the month view and you can go back in month view. However, above the <left and >right arrows, i also want to add a "year" which will let me go left and right on year. the calendar should get vertically bigger for this.
 - this makes it way easier to enter the year
 - i still want to keep the natural language entry, but make it more robust. also, i want to include a feature when the user clicks "ENTER" after entering a natural language input, it registers that as a submission and not a back button.


3. All calendars in the app should use the calendar from above, where the left right arrows work for year AND month.

~~4. Changes to Balance Update~~
 ~~- when a points balance goes down from the last value (so the current value has decreased), right now we use radio buttons to ask the user what happened~~
 ~~- if they did a transfer to partner, we want to use the same transfer to partner dialog we use in the "spend points", or redirect~~ 

5. Business logic changes for credit card account creation~~
 ~~- When i create a credit card account, i want to have a couple extra features.~~
 ~~- first i want to create TWO balance updates on credit card creation.~~
 ~~- the first is for the SUB~~
  ~~- if the account was opened >90 days ago (this will be defined by SUB duration, which we will define PER card later on – default will be 90 if not specified), the SUB should be added as the day x days after the account creation date. if not, then add it as day before current date, and then the next balance update should be the balance they speciied for the current date. this will be the first +90,000 or +70,000 added to the account.~~
 ~~- then the next balance update will be the balance update of the current account value on the Current DAY. so this will show at least two transactions, one for the SUB and one for the current balance.~~
 
  - feature request here: when i click 


6. Transfer to Partner Logic
- Implement real-time updates for points spending table after transfers
- Create bidirectional transaction linking between source and destination accounts
- Add cascading deletion:
  - When a transfer transaction is deleted from source account, automatically delete corresponding transaction in destination account
  - When a transfer transaction is deleted from destination account, automatically delete corresponding transaction in source account
- Ensure transaction pairs maintain referential integrity

7. "enter" to submit. this should work in any dropdown section of the app
 - if the user presses {down arrow}  and  selects an item by pressing enter instead of clicking it should do a quick ease out animation on the dropdown
 - this should work with calendars too. right now if i click enter after entering something to calendar, it goes back to the last dialog box. i dont want that.
 

 8. Account Name and Notes
 - Add ability to customize account name during creation and after
 - Add Account ID field during account creation to store membership/account numbers
 - Add notes field to store additional account information and context