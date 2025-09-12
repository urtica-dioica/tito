Payroll Computation with Total Hours Integration
Objective
Calculate an employee’s net pay in Philippine Peso (PHP) for a monthly pay period, incorporating total hours worked, leave pay, benefits, and deductions, with dynamic monthly working days.
Definitions of Variables

( t_{\text{clock-in}} ): Clock-in time (e.g., 8:31 AM = 8.5167 hours).
( t_{\text{clock-out}} ): Clock-out time (e.g., 18:00 = 18.0 hours).
( t_{\text{morning-start}} ): Morning start (default: 8.0 hours).
( t_{\text{morning-end}} ): Morning end (default: 12.0 hours).
( t_{\text{afternoon-start}} ): Afternoon start (default: 13.0 hours).
( t_{\text{afternoon-end}} ): Afternoon end (default: 17.0 hours).
( g ): Grace period (e.g., 0.5 hours).
( H_{\text{morning}} ): Morning hours (capped at 4).
( H_{\text{afternoon}} ): Afternoon hours (capped at 4).
( H_{\text{total-day}} ): Daily hours.
( H_{\text{total-period}} ): Total period hours.
( N_{\text{working-days}} ): Working days in month (e.g., 21, 22, or 23).
( H_{\text{monthly-working}} ): Monthly working hours (( N_{\text{working-days}} \times 8 )).
( S_{\text{base}} ): Base salary (e.g., ₱25000).
( L_{\text{days}} ): Leave days.
( P_{\text{benefit}} ): Benefit pay (e.g., ₱1500).
( D ): Deductions (e.g., ₱4000).
( P_{\text{gross}} ): Gross pay.
( P_{\text{leave}} ): Leave pay.
( P_{\text{net}} ): Net pay.

Rules
Total Hours

Session Caps: ( H_{\text{morning}} \leq 4 ), ( H_{\text{afternoon}} \leq 4 ).
Early Clock-In: Use ( t_{\text{morning-start}} ) or ( t_{\text{afternoon-start}} ) if early.
Grace Period: ( t_{\text{effective-in}} = \lceil t_{\text{clock-in}} - g/60 \rceil ).
Late Clock-Out: Cap at ( t_{\text{afternoon-end}} ).
Break Time: No hours from 12:01–12:59.

Payroll

Gross Pay: ( P_{\text{gross}} = \left( \frac{H_{\text{total-period}}}{H_{\text{monthly-working}}} \right) \times S_{\text{base}} ).
Leave Pay: ( P_{\text{leave}} = \left( \frac{L_{\text{days}} \times 8}{H_{\text{monthly-working}}} \right) \times S_{\text{base}} ).
Net Pay: ( P_{\text{net}} = P_{\text{gross}} + P_{\text{leave}} + P_{\text{benefit}} - D ).

Note: ( N_{\text{working-days}} ) varies by month (e.g., 21, 22, or 23 days), depending on calendar, weekends, and holidays. Thus, ( H_{\text{monthly-working}} = N_{\text{working-days}} \times 8 ) is dynamic.
Formulation
Step 1: Daily Hours

Morning:[t_{\text{effective-in-morning}} = \begin{cases}t_{\text{morning-start}}, & \text{if } t_{\text{clock-in}} < t_{\text{morning-start}} \\lceil t_{\text{clock-in}} - g/60 \rceil, & \text{otherwise}\end{cases}][H_{\text{morning}} = \min\left(4, \max\left(0, \min(t_{\text{clock-out}}, t_{\text{morning-end}}) - t_{\text{effective-in-morning}}\right)\right)]
Afternoon:[t_{\text{effective-in-afternoon}} = \begin{cases}t_{\text{afternoon-start}}, & \text{if } t_{\text{clock-in}} < t_{\text{afternoon-start}} \\lceil t_{\text{clock-in}} - g/60 \rceil, & \text{otherwise}\end{cases}][H_{\text{afternoon}} = \min\left(4, \max\left(0, \min(t_{\text{clock-out}}, t_{\text{afternoon-end}}) - t_{\text{effective-in-afternoon}}\right)\right)]
Total Daily:[H_{\text{total-day}} = H_{\text{morning}} + H_{\text{afternoon}}]
Total Period:[H_{\text{total-period}} = \sum_{\text{workdays}} H_{\text{total-day}}]

Step 2: Monthly Working Hours
[H_{\text{monthly-working}} = N_{\text{working-days}} \times 8]
Step 3: Gross Pay
[P_{\text{gross}} = \left( \frac{H_{\text{total-period}}}{H_{\text{monthly-working}}} \right) \times S_{\text{base}}]
Step 4: Leave Pay
[P_{\text{leave}} = \left( \frac{L_{\text{days}} \times 8}{H_{\text{monthly-working}}} \right) \times S_{\text{base}}]
Step 5: Net Pay
[P_{\text{net}} = P_{\text{gross}} + P_{\text{leave}} + P_{\text{benefit}} - D]
Example

Daily:
( t_{\text{clock-in}} = 8:31 ) AM, ( t_{\text{clock-out}} = 18:00 ) PM.
( g = 0.5 ), ( t_{\text{morning-start}} = 8.0 ), ( t_{\text{morning-end}} = 12.0 ).
( t_{\text{afternoon-start}} = 13.0 ), ( t_{\text{afternoon-end}} = 17.0 ).
( H_{\text{morning}} = 3 ), ( H_{\text{afternoon}} = 4 ), ( H_{\text{total-day}} = 7 ).


Monthly:
( N_{\text{working-days}} = 22 ), ( H_{\text{monthly-working}} = 22 \times 8 = 176 ).
( H_{\text{total-period}} = 22 \times 7 = 154 ).
( S_{\text{base}} = 25000 ) PHP, ( L_{\text{days}} = 2 ), ( P_{\text{benefit}} = 1500 ) PHP, ( D = 4000 ) PHP.


Calculations:
( P_{\text{gross}} = \left( \frac{154}{176} \right) \times 25000 \approx 21875 ).
( P_{\text{leave}} = \left( \frac{2 \times 8}{176} \right) \times 25000 \approx 2272.73 ).
( P_{\text{net}} = 21875 + 2272.73 + 1500 - 4000 \approx 21647.73 ).



Result: Net pay ≈ ₱21647.73.