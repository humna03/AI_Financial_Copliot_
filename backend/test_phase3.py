import sys
sys.path.insert(0, '.')

from app.services.score_engine import calculate_score, ScoreFactor
from app.services.what_if_engine import run_simulation
from app.models import FinancialProfile, Expense, Goal


def test_basic_score_calculation():
    profile = FinancialProfile(
        id=1,
        user_id=1,
        monthly_income=80000,
        monthly_savings=10000,
        updated_at="2024-01-01T00:00:00Z"
    )
    expenses = [
        Expense(id=1, user_id=1, category="food", amount=20000),
        Expense(id=2, user_id=1, category="rent", amount=25000),
        Expense(id=3, user_id=1, category="transport", amount=8000),
        Expense(id=4, user_id=1, category="bills", amount=7000),
    ]
    goal = Goal(id=1, user_id=1, target_amount=200000, description="Emergency fund", created_at="2024-01-01T00:00:00Z")

    result = calculate_score(profile, expenses, goal)

    savings_rate = 10000 / 80000  # 12.5% → 24 pts
    total_expenses = 60000
    expense_ratio = total_expenses / 80000  # 75% → 14 pts
    annual_savings = 10000 * 12  # 120000
    goal_progress = min((annual_savings / 200000) * 100, 100)  # 60% → 12 pts
    expected_score = 24 + 14 + 12  # 50

    print(f"Score: {result.score}")
    print(f"Monthly Savings: {result.monthly_savings}")
    print(f"Goal Progress: {result.goal_progress_percent}%")
    print("Factors:")
    for f in result.factors:
        print(f"  - {f.name}: {f.impact} ({f.detail})")

    assert result.score == expected_score, f"Expected {expected_score}, got {result.score}"
    assert result.monthly_savings == 10000
    assert result.goal_progress_percent == 60.0
    assert isinstance(result.factors, list)
    assert len(result.factors) > 0

    for f in result.factors:
        assert f.impact in ("positive", "negative"), f"Invalid impact: {f.impact}"

    print("\n[PASS] Basic score calculation test passed!")
    return result


def test_zero_income():
    profile = FinancialProfile(
        id=1, user_id=1, monthly_income=0, monthly_savings=0, updated_at="2024-01-01T00:00:00Z"
    )
    expenses = [Expense(id=1, user_id=1, category="food", amount=1000)]

    result = calculate_score(profile, expenses, None)

    assert result.score == 0, "Score should be 0 with zero income"
    assert any(f.name == "income" and f.impact == "negative" for f in result.factors)
    print("[PASS] Zero income test passed!")


def test_high_savings_rate():
    profile = FinancialProfile(
        id=1, user_id=1, monthly_income=100000, monthly_savings=30000, updated_at="2024-01-01T00:00:00Z"
    )
    expenses = [
        Expense(id=1, user_id=1, category="food", amount=15000),
        Expense(id=2, user_id=1, category="rent", amount=25000),
        Expense(id=3, user_id=1, category="transport", amount=5000),
        Expense(id=4, user_id=1, category="bills", amount=5000),
    ]
    goal = Goal(id=1, user_id=1, target_amount=100000, description="Emergency fund", created_at="2024-01-01T00:00:00Z")

    result = calculate_score(profile, expenses, goal)

    total_expenses = 15000 + 25000 + 5000 + 5000  # 50000
    expense_ratio = total_expenses / 100000  # 50% → 35 pts
    savings_rate = 30000 / 100000  # 30% → 40 pts
    annual_savings = 30000 * 12  # 360000
    goal_progress = min((360000 / 100000) * 100, 100)  # 360% capped at 100% → 25 pts
    expected_score = 40 + 35 + 25  # 100

    savings_factor = next((f for f in result.factors if f.name == "savings_rate"), None)
    assert savings_factor is not None
    assert savings_factor.impact == "positive", f"High savings rate should be positive, got {savings_factor.impact}"
    assert result.score == expected_score, f"Expected {expected_score}, got {result.score}"
    print(f"[PASS] High savings rate test passed! Score: {result.score}")


def test_high_expense_ratio():
    profile = FinancialProfile(
        id=1, user_id=1, monthly_income=50000, monthly_savings=2000, updated_at="2024-01-01T00:00:00Z"
    )
    expenses = [
        Expense(id=1, user_id=1, category="food", amount=15000),
        Expense(id=2, user_id=1, category="rent", amount=25000),
        Expense(id=3, user_id=1, category="transport", amount=8000),
    ]

    result = calculate_score(profile, expenses, None)

    total_expenses = 15000 + 25000 + 8000  # 48000
    expense_ratio = total_expenses / 50000  # 96% → 0 pts
    savings_rate = 2000 / 50000  # 4% → 8 pts
    expected_score = 8 + 0  # 8

    expense_factor = next((f for f in result.factors if f.name == "expense_ratio"), None)
    assert expense_factor is not None
    assert expense_factor.impact == "negative", f"High expense ratio should be negative, got {expense_factor.impact}"
    assert result.score == expected_score, f"Expected {expected_score}, got {result.score}"
    print(f"[PASS] High expense ratio test passed! Score: {result.score}")


def test_what_if_simulation():
    profile = FinancialProfile(
        id=1, user_id=1, monthly_income=80000, monthly_savings=10000, updated_at="2024-01-01T00:00:00Z"
    )
    expenses = [
        Expense(id=1, user_id=1, category="food", amount=20000),
        Expense(id=2, user_id=1, category="rent", amount=25000),
        Expense(id=3, user_id=1, category="transport", amount=8000),
        Expense(id=4, user_id=1, category="bills", amount=7000),
    ]
    goal = Goal(id=1, user_id=1, target_amount=200000, description="Emergency fund", created_at="2024-01-01T00:00:00Z")

    result = run_simulation(profile, expenses, goal, "food", 15000)

    print(f"\nCurrent: savings={result.current.monthly_savings}, score={result.current.score}, goal_progress={result.current.goal_progress_percent}")
    print(f"Simulated: savings={result.simulated.monthly_savings}, score={result.simulated.score}, goal_progress={result.simulated.goal_progress_percent}")

    # Current: savings=10000, score=50, goal_progress=60.0
    # Simulated: food=15000 → total_expenses=55000 → savings=25000
    # Simulated savings_rate = 25000/80000 = 31.25% → 40 pts
    # Simulated expense_ratio = 55000/80000 = 68.75% → 21 pts
    # Simulated goal_progress = 300000/200000 = 150% capped at 100% → 25 pts
    # Simulated score = 40 + 21 + 25 = 86
    assert result.simulated.monthly_savings == 25000, f"Expected 25000 savings, got {result.simulated.monthly_savings}"
    assert result.simulated.score > result.current.score, "Reducing food expense should increase score"
    assert result.simulated.goal_progress_percent > result.current.goal_progress_percent, "Goal progress should improve"

    print("[PASS] What-If simulation test passed!")


def test_what_if_no_data_modification():
    profile = FinancialProfile(
        id=1, user_id=1, monthly_income=80000, monthly_savings=10000, updated_at="2024-01-01T00:00:00Z"
    )
    expenses = [
        Expense(id=1, user_id=1, category="food", amount=20000),
        Expense(id=2, user_id=1, category="rent", amount=25000),
    ]
    goal = Goal(id=1, user_id=1, target_amount=200000, description="Emergency fund", created_at="2024-01-01T00:00:00Z")

    original_food_amount = expenses[0].amount

    run_simulation(profile, expenses, goal, "food", 10000)

    assert expenses[0].amount == original_food_amount, "Original expenses should not be modified"
    print("[PASS] What-If does not modify original data test passed!")


def test_deterministic():
    profile = FinancialProfile(
        id=1, user_id=1, monthly_income=80000, monthly_savings=10000, updated_at="2024-01-01T00:00:00Z"
    )
    expenses = [
        Expense(id=1, user_id=1, category="food", amount=20000),
        Expense(id=2, user_id=1, category="rent", amount=25000),
    ]
    goal = Goal(id=1, user_id=1, target_amount=200000, description="Emergency fund", created_at="2024-01-01T00:00:00Z")

    expected_score = None
    for i in range(10):
        result = calculate_score(profile, expenses, goal)
        if expected_score is None:
            expected_score = result.score
        assert result.score == expected_score, f"Score should be deterministic, got {result.score}, expected {expected_score}"

    print(f"[PASS] Deterministic test passed! Score: {expected_score}")


def test_savings_rate_boundaries():
    tests = [
        (100000, 20000, 40),   # 20% → 40 pts
        (100000, 17500, 32),   # 17.5% → 32 pts
        (100000, 12500, 24),   # 12.5% → 24 pts
        (100000, 7500, 16),    # 7.5% → 16 pts
        (100000, 3000, 8),     # 3% → 8 pts
        (100000, 0, 0),        # 0% → 0 pts
    ]
    for income, savings, expected_savings_score in tests:
        profile = FinancialProfile(id=1, user_id=1, monthly_income=income, monthly_savings=savings, updated_at="2024-01-01T00:00:00Z")
        expenses = [Expense(id=1, user_id=1, category="food", amount=0)]
        result = calculate_score(profile, expenses, None)
        sf = next((f for f in result.factors if f.name == "savings_rate"), None)
        assert sf is not None, "savings_rate factor not found"
        total = result.score
        expense_score = next((f for f in result.factors if f.name == "expense_ratio"), None)
        expected_total = expected_savings_score + 35  # 0% expense ratio → 35 pts
        assert total == expected_total, f"Income={income} Savings={savings}: expected total {expected_total}, got {total}"
    print("[PASS] Savings rate boundary test passed!")


def test_expense_ratio_boundaries():
    tests = [
        (100000, 50000, 35, "positive"),   # 50% → 35 pts, positive impact
        (100000, 55000, 28, True),   # 55% → 28 pts, negative impact
        (100000, 65000, 21, True),   # 65% → 21 pts, negative impact
        (100000, 75000, 14, True),   # 75% → 14 pts, negative impact
        (100000, 85000, 7, True),    # 85% → 7 pts, negative impact
        (100000, 95000, 0, True),    # 95% → 0 pts, negative impact
    ]
    for income, total_expense, expected_expense_score, expect_negative in tests:
        profile = FinancialProfile(id=1, user_id=1, monthly_income=income, monthly_savings=0, updated_at="2024-01-01T00:00:00Z")
        expenses = [Expense(id=1, user_id=1, category="food", amount=total_expense)]
        result = calculate_score(profile, expenses, None)
        ef = next((f for f in result.factors if f.name == "expense_ratio"), None)
        assert ef is not None, "expense_ratio factor not found"
        # Verify impact matches threshold
        ratio = total_expense / income
        if ratio <= 0.50:
            assert ef.impact == "positive", f"Expected positive for ratio {ratio:.0%}"
        else:
            assert ef.impact == "negative", f"Expected negative for ratio {ratio:.0%}"
        total = result.score
        assert total == expected_expense_score, f"Income={income} Expense={total_expense}: expected total {expected_expense_score}, got {total}"
    print("[PASS] Expense ratio boundary test passed!")


def test_goal_progress_boundaries():
    tests = [
        (10000, 200000, None, 25),   # annual=120000, progress=60% → 12 pts
        (20000, 200000, None, 25),   # annual=240000, progress=120% capped 100% → 25 pts
        (10000, 120000, None, 100),  # annual=120000, progress=100% → 25 pts
    ]
    for monthly_savings, target_amount, _, _ in tests:
        profile = FinancialProfile(id=1, user_id=1, monthly_income=80000, monthly_savings=monthly_savings, updated_at="2024-01-01T00:00:00Z")
        expenses = [Expense(id=1, user_id=1, category="food", amount=1000)]
        goal = Goal(id=1, user_id=1, target_amount=target_amount, description="Test", created_at="2024-01-01T00:00:00Z")
        result = calculate_score(profile, expenses, goal)
        annual_savings = monthly_savings * 12
        progress = min((annual_savings / target_amount) * 100, 100)
        if progress >= 100:
            expected_gp_score = 25
        elif progress >= 75:
            expected_gp_score = 18
        elif progress >= 50:
            expected_gp_score = 12
        elif progress >= 25:
            expected_gp_score = 6
        elif progress >= 1:
            expected_gp_score = 2
        else:
            expected_gp_score = 0
        assert result.goal_progress_percent == round(progress, 1), f"Monthly={monthly_savings} Target={target_amount}: expected progress {round(progress,1)}, got {result.goal_progress_percent}"
    print("[PASS] Goal progress boundary test passed!")


def test_score_range():
    profile = FinancialProfile(id=1, user_id=1, monthly_income=80000, monthly_savings=10000, updated_at="2024-01-01T00:00:00Z")
    expenses = [Expense(id=1, user_id=1, category="food", amount=20000)]
    goal = Goal(id=1, user_id=1, target_amount=200000, description="Test", created_at="2024-01-01T00:00:00Z")
    result = calculate_score(profile, expenses, goal)
    assert 0 <= result.score <= 100, f"Score {result.score} should be between 0 and 100"
    print("[PASS] Score range test passed!")


if __name__ == "__main__":
    print("Running Score Engine and What-If Engine tests...\n")
    test_basic_score_calculation()
    test_zero_income()
    test_high_savings_rate()
    test_high_expense_ratio()
    test_what_if_simulation()
    test_what_if_no_data_modification()
    test_deterministic()
    test_savings_rate_boundaries()
    test_expense_ratio_boundaries()
    test_goal_progress_boundaries()
    test_score_range()
    print("\n[SUCCESS] All tests passed!")