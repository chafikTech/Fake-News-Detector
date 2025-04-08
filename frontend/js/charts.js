// Feature importance chart
function createFeatureChart(features, importance) {
    const ctx = document.getElementById('featureChart').getContext('2d');

    // Reverse the arrays to make the highest importance features appear at the top
    const reversedFeatures = [...features].reverse();
    const reversedImportance = [...importance].reverse();

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: reversedFeatures,
            datasets: [{
                label: 'Feature Importance',
                data: reversedImportance,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Importance: ${context.raw.toFixed(3)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Importance'
                    }
                }
            }
        }
    });
}
