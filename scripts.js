// document.addEventListener('DOMContentLoaded', function() {
//     fetch('flu_data.json')
//         .then(response => response.json())
//         .then(data => {
//             const stateData = data.reduce((acc, curr) => {
//                 if (!acc[curr.REGION]) {
//                     acc[curr.REGION] = [];
//                 }
//                 acc[curr.REGION].push(curr['%UNWEIGHTED ILI']);
//                 return acc;
//             }, {});

//             const chartData = {
//                 labels: Object.keys(stateData),
//                 datasets: [{
//                     label: '% of Flu-Related Visits',
//                     data: Object.values(stateData).map(ili => ili.reduce((a, b) => a + b, 0) / ili.length),
//                     backgroundColor: 'blue'
//                 }]
//             };

//             const ctx = document.getElementById('chart').getContext('2d');
//             new Chart(ctx, {
//                 type: 'bar',
//                 data: chartData,
//                 options: {
//                     scales: {
//                         y: {
//                             beginAtZero: true
//                         }
//                     },
//                     indexAxis: 'x'  // Use 'x' if you want horizontal bars
//                 }
//             });
//         })
//         .catch(error => console.error('Error loading the flu data:', error));
// });

// // ... (rest of your JavaScript code for fetching data and setting up the chart)

// const ctx = document.getElementById('chart').getContext('2d');
// new Chart(ctx, {
//     type: 'bar',
//     data: chartData,
//     options: {
//         responsive: true,
//         maintainAspectRatio: false, // Add this to make the chart fill the container
//         // ... (rest of your options)
//     }
// });



document.addEventListener('DOMContentLoaded', function() {
    const regionSelector = document.getElementById('region-selector');
    const charts = {}; // To keep track of chart instances

    // Define the chart creation function
    function createChart(canvasId, chartData) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        // Destroy any existing chart
        if (charts[canvasId]) {
            charts[canvasId].destroy();
        }
        // Create a new chart instance
        charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Function to process chart data
function processData(data, key, sum=false) {
    return data.reduce((acc, item) => {
        const value = item[key];
        if (sum) {
            acc[value] = (acc[value] || 0) + item.ILITOTAL;
        } else {
            if (key === 'AGE GROUP') {
                // Handle multiple age groups separately
                const ageGroups = ['AGE 0-4', 'AGE 5-24', 'AGE 25-49', 'AGE 50-64', 'AGE 65'];
                ageGroups.forEach(ageGroup => {
                    acc[ageGroup] = (acc[ageGroup] || []).concat(item[ageGroup]);
                });
            } else {
                // Handle other keys as before
                if (!acc[value]) {
                    acc[value] = [];
                }
                acc[value].push(item['%UNWEIGHTED ILI']);
            }
        }
        return acc;
    }, {});
}

    

    // Function to update charts
    function updateCharts(data) {

        console.log("Updating charts with data: ", data);

        // Filter data based on the selected region if not 'All'

        const selectedRegion = regionSelector.value;
        const filteredData = selectedRegion !== 'All' ? data.filter(item => item.REGION === selectedRegion) : data;

        const percentageChartData = prepareChartData(processData(filteredData, 'REGION'));
        console.log("Percentage Chart Data:", percentageChartData); // Log the data for the first chart
        createChart('chart', percentageChartData);

        const totalChartData = prepareChartData(processData(filteredData, 'REGION', true));
        console.log("Total Chart Data:", totalChartData); // Log the data for the second chart
        createChart('chart-total', totalChartData);

        // Now process and create charts for the third and fourth charts
        const ageGroupChartData = prepareChartData(processData(filteredData, 'AGE GROUP'));
        ageGroupChartData.labels = ['0-4', '5-24', '25-49', '50-64', '65']; // Set the specific labels
        createChart('chart-age-group', ageGroupChartData);

        const weeklyChartData = prepareChartData(processData(filteredData, 'WEEK', true)); // Make sure 'WEEK' matches your data
        console.log("Weekly Chart Data: ", weeklyChartData);
        createChart('chart-weekly', weeklyChartData);
    

        // Add more chart processing and creation as needed
    }

    // Helper function to prepare chart data

    function prepareChartData(processedData) {
        const labels = Object.keys(processedData);
        const data = Object.values(processedData).map(value => {
            // Ensure the value is an array and calculate the average
            if (Array.isArray(value)) {
                const sum = value.reduce((a, b) => a + b, 0);
                return (sum / value.length) || 0; // Avoid division by zero, return 0 if length is 0
            } else {
                return value || 0; // Ensure that value is not undefined
            }
        });
    
        // Define a single color or create a gradient if preferred
        const backgroundColor = 'rgba(0, 145, 213, 0.7)';
        


        return {
            labels: labels,
            datasets: [{
                label: 'Flu Data',
                data: data,
                backgroundColor: data.map(() => backgroundColor), // Use the same color for all bars
            }]
        };
    }

    // Fetch data and setup event listener for region selector
    
    fetch('flu_data.json')
        .then(response => response.json())
        .then(data => {
            // Populate region dropdown
            const regions = new Set(data.map(item => item.REGION));
            regionSelector.innerHTML = `<option value="All">All Regions</option>`;
            regions.forEach(region => {
                regionSelector.innerHTML += `<option value="${region}">${region}</option>`;
            });

            // Initial chart creation
            updateCharts(data);
        });

    // Event listener for region dropdown change
    regionSelector.addEventListener('change', () => {
        fetch('flu_data.json')
            .then(response => response.json())
            .then(data => {
                console.log("Region changed. Updating charts...");
                updateCharts(data);
            });
    });
});





