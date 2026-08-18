#!/bin/bash

# Quick Reference Commands for new_api_comparison Database

echo "=========================================="
echo "📊 DATABASE: new_api_comparison"
echo "=========================================="
echo ""

echo "1. Check database contents:"
docker exec -i api-comparison-db psql -U postgres -d new_api_comparison -c "SELECT 'Projects' as entity, COUNT(*) FROM \"Project\" UNION ALL SELECT 'Tasks', COUNT(*) FROM \"Task\";"

echo ""
echo "2. View sample projects (top 5):"
docker exec -i api-comparison-db psql -U postgres -d new_api_comparison -c "SELECT id, name, description FROM \"Project\" LIMIT 5;"

echo ""
echo "3. View sample tasks (top 5):"
docker exec -i api-comparison-db psql -U postgres -d new_api_comparison -c "SELECT id, title, status FROM \"Task\" LIMIT 5;"

echo ""
echo "4. Check task distribution by project:"
docker exec -i api-comparison-db psql -U postgres -d new_api_comparison -c "SELECT p.name, COUNT(t.id) as task_count FROM \"Project\" p LEFT JOIN \"Task\" t ON p.id = t.\"projectId\" GROUP BY p.id, p.name ORDER BY task_count DESC LIMIT 10;"

echo ""
echo "=========================================="
echo "✅ Ready for load testing!"
echo "=========================================="
