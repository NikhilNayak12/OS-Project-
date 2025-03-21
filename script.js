let processes = [];

        function addProcess() {
            const pid = document.getElementById("pid").value;
            const arrival = parseInt(document.getElementById("arrival").value);
            const burst = parseInt(document.getElementById("burst").value);
            const priority = parseInt(document.getElementById("priority").value) || 0;
            if (pid && !isNaN(arrival) && !isNaN(burst)) {
                processes.push({ pid, arrival, burst, priority, remaining: burst, completed: false });
                updateProcessTable();
                console.log("Processes:", processes); 
            }
        }

        function updateProcessTable() {
            const tableBody = document.getElementById("processTable").querySelector("tbody");
            tableBody.innerHTML = "";
            processes.forEach(proc => {
                const row = document.createElement("tr");
                row.innerHTML = `<td>${proc.pid}</td><td>${proc.arrival}</td><td>${proc.burst}</td><td>${proc.priority}</td>`;
                tableBody.appendChild(row);
            });
        }

        function schedule() {
            const algo = document.getElementById("algorithm").value;
            let ganttData = [];
            console.log("Scheduling algorithm:", algo);
            console.log("Processes before scheduling:", processes); 
            if (algo === "fcfs") {
                processes.sort((a, b) => a.arrival - b.arrival);
                let time = 0;
                processes.forEach(proc => {
                    if (time < proc.arrival) time = proc.arrival;
                    ganttData.push({ pid: proc.pid, start: time, end: time + proc.burst });
                    time += proc.burst;
                });
            } else if (algo === "sjf") {
                let time = 0, completed = 0;
                let readyQueue = [];
                while (completed < processes.length) {
                    processes.forEach(p => { if (!p.completed && p.arrival <= time) readyQueue.push(p); });
                    if (readyQueue.length) {
                        readyQueue.sort((a, b) => a.burst - b.burst);
                        let p = readyQueue.shift();
                        ganttData.push({ pid: p.pid, start: time, end: time + p.burst });
                        time += p.burst;
                        p.completed = true;
                        completed++;
                    } else {
                        time++;
                    }
                }
            } else if (algo === "sjf-preemptive") {
                let time = 0, completed = 0;
                let readyQueue = [];
                while (completed < processes.length) {
                    processes.forEach(p => { if (!p.completed && p.arrival <= time && !readyQueue.includes(p)) readyQueue.push(p); });
                    if (readyQueue.length) {
                        readyQueue.sort((a, b) => a.remaining - b.remaining);
                        let p = readyQueue.shift();
                        ganttData.push({ pid: p.pid, start: time, end: time + 1 });
                        time++;
                        p.remaining--;
                        if (p.remaining === 0) {
                            p.completed = true;
                            completed++;
                        }
                    } else {
                        time++;
                    }
                }
            } else if (algo === "rr") {
                let queue = [...processes];
                let time = 0;
                const quantum = parseInt(document.getElementById("quantum").value);
                while (queue.length > 0) {
                    let p = queue.shift();
                    if (p.remaining > quantum) {
                        ganttData.push({ pid: p.pid, start: time, end: time + quantum });
                        time += quantum;
                        p.remaining -= quantum;
                        queue.push(p);
                    } else {
                        ganttData.push({ pid: p.pid, start: time, end: time + p.remaining });
                        time += p.remaining;
                        p.remaining = 0;
                    }
                }
            }
            console.log("Gantt Data:", ganttData); 
            displayGanttChart(ganttData);
            calculateTimes(ganttData);
        }

        function displayGanttChart(data) {
            const chart = document.getElementById("ganttChart");
            chart.innerHTML = "";
            console.log("Displaying Gantt Chart:", data); 
            data.forEach(({ pid, start, end }, index) => {
                setTimeout(() => {
                    let div = document.createElement("div");
                    div.classList.add("process");
                    div.innerText = `P${pid}\n${start}-${end}`;
                    div.style.width = `${(end - start) * 20}px`;
                    div.style.background = "lightblue";
                    div.style.transform = "scale(1.1)";
                    setTimeout(() => { div.style.transform = "scale(1)"; }, 500);
                    chart.appendChild(div);
                }, index * 500);
            });
        }

        function calculateTimes(ganttData) {
            let waitingTimes = {};
            let turnaroundTimes = {};
            let completionTimes = {};

            ganttData.forEach(({ pid, end }) => {
                completionTimes[pid] = end;
            });

            processes.forEach(proc => {
                turnaroundTimes[proc.pid] = completionTimes[proc.pid] - proc.arrival;
                waitingTimes[proc.pid] = turnaroundTimes[proc.pid] - proc.burst;
            });

            const avgWaitingTime = Object.values(waitingTimes).reduce((a, b) => a + b, 0) / processes.length;
            const avgTurnaroundTime = Object.values(turnaroundTimes).reduce((a, b) => a + b, 0) / processes.length;

            document.getElementById("avgWaitingTime").innerText = `Average Waiting Time: ${avgWaitingTime.toFixed(2)}`;
            document.getElementById("avgTurnaroundTime").innerText = `Average Turnaround Time: ${avgTurnaroundTime.toFixed(2)}`;
        }