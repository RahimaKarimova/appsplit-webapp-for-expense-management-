document.addEventListener("DOMContentLoaded", function () {
    const expenseGroupList = document.getElementById("expenseGroupList");
    const createExpenseGroupBtn = document.getElementById("createExpenseGroupBtn");
    const createExpenseGroupModal = document.getElementById("createExpenseGroupModal");
    const closeCreateExpenseGroupModal = document.getElementsByClassName("close")[0];
    const expenseGroupForm = document.getElementById("expenseGroupForm");


    let expenseGroups = [];


    function logout() {

        localStorage.removeItem("auth-token");
        // Redirect to login page
        window.location.href = "/login.html";
    }


    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    function displayExpenseGroups() {
        expenseGroupList.innerHTML = "";

        expenseGroups.forEach(group => {
            const listItem = document.createElement("li");
            listItem.textContent = `${group.name} (Created on ${group.dateCreated})`;
            listItem.addEventListener("click", () => {
                displayExpenseGroupDetails(group);
            });
            expenseGroupList.appendChild(listItem);
        });
    }

    function calculateOwes(group) {
        let owes = {};
        group.participants.forEach(participant => {
            owes[participant] = 0;
        });

        group.expenses.forEach(expense => {
            const perPersonCost = expense.amount / group.participants.length; // Calculate cost per person
            group.participants.forEach(participant => {
                if (participant !== expense.paidBy) {
                    // Calculate total amount already paid by the participant
                    const previousExpensesPaidByParticipant = group.expenses
                        .filter(e => e.paidBy === participant && e !== expense)
                        .reduce((total, e) => total + e.amount, 0);
                    const totalAmountPaidByParticipant = previousExpensesPaidByParticipant + owes[participant];

                    // Add per person cost to owes if not the one who paid
                    owes[participant] += perPersonCost - (totalAmountPaidByParticipant / group.participants.length);
                }
            });
        });

        return owes;
    }

    // Function to calculate total owes between participants in all expense groups
    function calculateTotalOwes() {
        let totalOwes = {};

        // Iterate over each expense group
        expenseGroups.forEach(group => {
            const groupOwes = calculateOwes(group); // Calculate owes within the current group

            // Iterate over each participant in the current group
            group.participants.forEach(participant => {
                // If the participant doesn't exist in totalOwes, initialize their owes to 0
                if (!totalOwes[participant]) {
                    totalOwes[participant] = 0;
                }

                // Add the owes from the current group to totalOwes
                for (const otherParticipant in groupOwes[participant]) {
                    totalOwes[participant] += groupOwes[participant][otherParticipant];
                }
            });
        });

        return totalOwes;
    }

    // Function to display detailed information of the selected expense group
    function displayExpenseGroupDetails(group) {
        const expenseGroupInfo = document.getElementById("expenseGroupInfo");
        let totalAmount = 0;
        group.expenses.forEach(expense => {
            totalAmount += expense.amount;
        });

        expenseGroupInfo.innerHTML = `
            <p><strong>Name:</strong> ${group.name}</p>
            <p><strong>Date Created:</strong> ${group.dateCreated}</p>
            <p><strong>Total Amount:</strong> ${totalAmount} TL</p>
        `;

        const expenseDetails = document.getElementById("expenseDetails");
        expenseDetails.innerHTML = `
            <div class="expense-details">
                <h3>Expenses:</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Expense</th>
                            <th>Paid By</th>
                            <th>Amount (TL)</th>
                            <th>Amount Per Person</th>
                            <th>Participants that Owe</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${group.expenses.map(expense => `
                            <tr>
                                <td>${expense.name}</td>
                                <td>${expense.paidBy}</td>
                                <td>${expense.amount}</td>
                                <td>${expense.amount / group.participants.length}</td>
                                <td>${displayParticipantsOwing(group, expense)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const addExpenseFormContainer = document.getElementById("addExpenseFormContainer");
        addExpenseFormContainer.innerHTML = `
            <div class="expense-details">
                <h3>Add Expense</h3>
                <form id="addExpenseForm">
                    <div class="form-group">
                        <label for="expenseName">Expense Name</label>
                        <input type="text" id="expenseName" name="expenseName" required>
                    </div>
                    <div class="form-group">
                        <label for="expenseAmount">Amount (TL)</label>
                        <input type="number" id="expenseAmount" name="expenseAmount" required>
                    </div>
                    <div class="form-group">
                        <label for="expenseDate">Expense Date</label>
                        <input type="date" id="expenseDate" name="expenseDate" required>
                    </div>
                    <div class="form-group">
                        <label for="participant">Participant</label>
                        <select id="participant" name="participant" required>
                            ${group.participants.map(participant => `
                                <option value="${participant}">${participant}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <input type="submit" value="Add Expense">
                    </div>
                </form>
            </div>
        `;

        const addExpenseForm = document.getElementById("addExpenseForm");
        addExpenseForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const expenseName = document.getElementById("expenseName").value;
            const expenseAmount = parseFloat(document.getElementById("expenseAmount").value);
            const expenseDate = document.getElementById("expenseDate").value;
            const participant = document.getElementById("participant").value;


            const newExpense = { name: expenseName, amount: expenseAmount, date: expenseDate, paidBy: participant };
            group.expenses.push(newExpense);


            document.getElementById("expenseName").value = "";
            document.getElementById("expenseAmount").value = "";
            document.getElementById("expenseDate").value = "";

            displayExpenseGroupDetails(group);
            displayTotalOwes();
        });
    }

    // Function to display participants owing for a particular expense
    function displayParticipantsOwing(group, expense) {
        const participantsOwing = getParticipantsOwing(group, expense);
        let result = '';
        for (const participant in participantsOwing) {
            result += `${participant} owes ${participantsOwing[participant]} TL, `;
        }
        return result.slice(0, -2);
    }

    // Function to calculate who owes whom for a particular expense
    function getParticipantsOwing(group, expense) {
        const perPersonCost = expense.amount / group.participants.length;
        const owes = {};
        group.participants.forEach(participant => {
            if (participant !== expense.paidBy) {
                owes[participant] = perPersonCost;
            }
        });
        return owes;
    }


    // Function to display total owes between participants
    function displayTotalOwes() {
        const totalOwesContainer = document.getElementById("totalOwes");
        totalOwesContainer.innerHTML = ''; // Clear existing content

        const totalOwes = calculateTotalOwes();
        for (const participant in totalOwes) {
            const amountOwed = totalOwes[participant];
            if (amountOwed > 0) {
                totalOwesContainer.innerHTML += `<p>${participant} owes others ${amountOwed.toFixed(2)} TL</p>`;
            }
        }
    }

    // Call the function to display total owes
    displayTotalOwes();

    // Event listener for opening the create expense group modal
    createExpenseGroupBtn.addEventListener("click", () => {
        createExpenseGroupModal.style.display = "block";
    });

    // Event listener for closing the create expense group modal
    closeCreateExpenseGroupModal.addEventListener("click", () => {
        createExpenseGroupModal.style.display = "none";
    });

    // Event listener for submitting the create expense group form
    expenseGroupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const groupName = document.getElementById("groupName").value;
        const groupDate = document.getElementById("groupDate").value;
        const participants = document.getElementById("groupParticipants").value.split(',');

        // Dummy action (replace with actual logic for creating new expense group)
        const newGroupId = expenseGroups.length + 1;
        const newGroup = { id: newGroupId, name: groupName, dateCreated: groupDate, participants: participants, expenses: [] };
        expenseGroups.push(newGroup);

        // Clear form inputs
        document.getElementById("groupName").value = "";
        document.getElementById("groupDate").value = "";
        document.getElementById("groupParticipants").value = "";

        // Close the modal
        createExpenseGroupModal.style.display = "none";

        // Refresh expense groups list
        displayExpenseGroups();
    });

    // Display initial expense groups
    displayExpenseGroups();
});
