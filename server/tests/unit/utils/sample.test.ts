describe('Sample Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const greeting = 'Hello';
    const name = 'World';
    expect(`${greeting} ${name}`).toBe('Hello World');
  });

  it('should handle array operations', () => {
    const numbers = [1, 2, 3, 4, 5];
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    expect(sum).toBe(15);
  });

  it('should handle object operations', () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com'
    };
    
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    expect(user.name).toBe('John Doe');
  });
});