![NBomber API Testing](https://images.unsplash.com/photo-1607799279861-4dd421887fb3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80)

# NBomber Tutorial: Complete Guide to API Load Testing in C#

**Author:** Asterisk Dev  
**Date:** May 31, 2025  
**Tags:** programming, csharp, performance, nbomber, tutorial, load-testing, api-testing  

Finding out your API collapses under load in production is like discovering your parachute has a hole... while skydiving. NBomber helps you discover these issues while you're still on the ground.

In this complete guide, I'll walk you through setting up NBomber from scratch and show you exactly how to load test your APIs with real code examples you can follow along with.

---

## The Calm Before the Storm

Picture this: You've just finished building a beautiful new API. The code is clean, the endpoints are RESTful, and your unit tests are greener than a vegan's grocery cart. Life is good.

Then launch day arrives. Everything starts off smoothly. A few requests trickle in, and your API handles them with grace. You lean back in your chair, take a sip of coffee, and think, "I've got this."

But then, as if the universe heard your confidence and took it as a challenge, traffic starts to pick up. 10 requests per second becomes 50, then 100, then 500. Suddenly, your beautiful API is gasping for breath, response times are skyrocketing, and errors are popping up like mushrooms after rain.

Your Slack is blowing up. Your boss is calling. That coffee you were sipping? It's now cold, just like the sweat running down your back.

This, my friends, is what we in the industry call "a bad day." And it's entirely preventable.

## What We'll Build in This Tutorial

By the end of this article, you'll have:

1. A simple ASP.NET Core Web API with a few endpoints that we'll use as our test subject
2. A complete NBomber test project that can simulate various load patterns
3. The knowledge to identify and fix common performance bottlenecks
4. Beautiful HTML reports showing your API's performance characteristics

All the code is available in [this GitHub repository](https://github.com/wisedev-pstach/nbomber-tutorial) if you want to skip ahead or check your work.

## Setting Up Our Projects

Let's start by creating two projects: a simple API to test and an NBomber test project.

### 1. Creating the API Project

First, let's create a simple ASP.NET Core Web API that we'll use as our test subject. Open your terminal and run:

```bash
dotnet new webapi -n ProductApi
cd ProductApi
```

Now, let's add a simple Product model and controller. Create a `Models` folder and add a `Product.cs` file:

```csharp
namespace ProductApi.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public string Description { get; set; } = "";
    public int StockQuantity { get; set; }
}
```

Next, let's create a simple in-memory repository to store our products. Create a `Repositories` folder and add a `ProductRepository.cs` file:

```csharp
using ProductApi.Models;

namespace ProductApi.Repositories;

public class ProductRepository
{
    private static readonly List<Product> _products = new();
    private static int _nextId = 1;

    static ProductRepository()
    {
        // Seed with some initial products
        for (int i = 0; i < 1000; i++)
        {
            _products.Add(new Product
            {
                Id = _nextId++,
                Name = $"Product {i}",
                Price = 10.99m + i,
                Description = $"This is product {i}",
                StockQuantity = 100
            });
        }
    }

    public IEnumerable<Product> GetAll()
    {
        return _products;
    }

    public Product? GetById(int id)
    {
        return _products.FirstOrDefault(p => p.Id == id);
    }

    public IEnumerable<Product> Search(string term)
    {
        // Deliberately inefficient search to demonstrate performance issues
        Thread.Sleep(10); // Simulate some processing time
        return _products.Where(p => 
            p.Name.Contains(term, StringComparison.OrdinalIgnoreCase) || 
            p.Description.Contains(term, StringComparison.OrdinalIgnoreCase));
    }

    public Product Add(Product product)
    {
        product.Id = _nextId++;
        _products.Add(product);
        return product;
    }
}
```

Now, let's create a controller to expose our product operations. Create a `Controllers/ProductsController.cs` file:

```csharp
using Microsoft.AspNetCore.Mvc;
using ProductApi.Models;
using ProductApi.Repositories;

namespace ProductApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ProductRepository _repository;

    public ProductsController()
    {
        _repository = new ProductRepository();
    }

    [HttpGet]
    public ActionResult<IEnumerable<Product>> GetAll()
    {
        return Ok(_repository.GetAll());
    }

    [HttpGet("{id}")]
    public ActionResult<Product> GetById(int id)
    {
        var product = _repository.GetById(id);
        if (product == null)
            return NotFound();

        return Ok(product);
    }

    [HttpGet("search")]
    public ActionResult<IEnumerable<Product>> Search([FromQuery] string term)
    {
        return Ok(_repository.Search(term));
    }

    [HttpPost]
    public ActionResult<Product> Create(Product product)
    {
        var newProduct = _repository.Add(product);
        return CreatedAtAction(nameof(GetById), new { id = newProduct.Id }, newProduct);
    }
}
```

Finally, let's register our repository in `Program.cs` for dependency injection:

```csharp
using ProductApi.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<ProductRepository>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
```

Now we have a simple API with a few endpoints:
- GET /api/products - Get all products
- GET /api/products/{id} - Get a product by ID
- GET /api/products/search?term={term} - Search for products
- POST /api/products - Create a new product

### 2. Creating the NBomber Test Project

Now, let's create a separate project for our NBomber tests:

```bash
dotnet new console -n ProductApi.LoadTests
cd ProductApi.LoadTests
```

Let's add the necessary NuGet packages:

```bash
dotnet add package NBomber
dotnet add package NBomber.Http
```

## Implementing Our First NBomber Test

Now that we have our API project set up, let's create our first NBomber test. Open the `Program.cs` file in your `ProductApi.LoadTests` project and replace its contents with the following:

```csharp
using NBomber.Contracts.Stats;
using NBomber.CSharp;
using NBomber.Http.CSharp;

// 1. Create HTTP client
var httpClient = new HttpClient();

// 2. Define our test scenario using Step.Run
var scenario = Scenario.Create("get_all_products", async context =>
{
    var step1 = await Step.Run("get_all_products", context, async () =>
    {
        var request = Http.CreateRequest("GET", "http://localhost:5062/api/products");
        
        var response = await Http.Send(httpClient, request);
        
        return !response.IsError
            ? Response.Ok() 
            : Response.Fail();
    });

    return Response.Ok();
})
.WithWarmUpDuration(TimeSpan.FromSeconds(5))
.WithLoadSimulations(
    Simulation.KeepConstant(copies: 10, during: TimeSpan.FromSeconds(30))
);

// 3. Run the test
NBomberRunner
    .RegisterScenarios(scenario)
    .WithReportFormats(ReportFormat.Html, ReportFormat.Csv)
    .WithReportFileName("get_all_products_report")
    .Run();

Console.WriteLine("Load test complete. Press any key to exit...");
Console.ReadKey();
```

Let's break down what this code does:

1. We create an HTTP client factory that NBomber will use to make requests.
2. We define a step that will make a GET request to our products endpoint.
3. We create a scenario that will run this step with 10 concurrent users for 30 seconds.
4. We run the test and generate HTML and CSV reports.

> **Note**: Make sure to update the URL to match your API's port number. The default port for HTTPS in ASP.NET Core is 7184, but yours might be different.

## Running Our First Test

Before we can run our test, we need to start our API. Open a terminal, navigate to your ProductApi directory, and run:

```bash
dotnet run
```

You should see output indicating that your API is running. Take note of the URL (it will be something like `https://localhost:7184`).

Now, open another terminal, navigate to your ProductApi.LoadTests directory, and run:

```bash
dotnet run
```

You should see NBomber starting up, running the test, and then generating a report. When it's done, you'll find an HTML report in the `reports` directory within your project.

Open the HTML report in your browser to see the results. You should see something like this:

![NBomber Report](https://i.imgur.com/XYZ123.png)

## Testing Different Endpoints

Let's expand our test to cover more endpoints. Update your `Program.cs` file in the `ProductApi.LoadTests` project:

```csharp
using NBomber.Contracts.Stats;
using NBomber.CSharp;
using NBomber.Http.CSharp;
using System.Text;
using System.Text.Json;

// 1. Create HTTP client
var httpClient = new HttpClient();

// Base URL for our API
var baseUrl = "http://localhost:5062";

// 2. Define scenarios for different API operations

// Scenario 1: Test the GET all products endpoint
var getAllProductsScenario = Scenario.Create("get_all_products_scenario", async context =>
{
    var step1 = await Step.Run("get_all_products", context, async () =>
    {
        var request = Http.CreateRequest("GET", $"{baseUrl}/api/products");
        var response = await Http.Send(httpClient, request);
        
        return !response.IsError 
            ? Response.Ok() 
            : Response.Fail();
    });

    return Response.Ok();
})
.WithWarmUpDuration(TimeSpan.FromSeconds(5))
.WithLoadSimulations(
    Simulation.KeepConstant(copies: 50, during: TimeSpan.FromSeconds(30))
);

// Scenario 2: Test the search endpoint (which has our deliberate inefficiency)
var searchProductsScenario = Scenario.Create("search_products_scenario", async context =>
{
    var step1 = await Step.Run("search_products", context, async () =>
    {
        // Generate a random search term
        var searchTerms = new[] { "product", "1", "2", "3", "4", "5" };
        var term = searchTerms[Random.Shared.Next(searchTerms.Length)];
        
        var request = Http.CreateRequest("GET", $"{baseUrl}/api/products/search?term={term}");
        var response = await Http.Send(httpClient, request);
        
        return !response.IsError 
            ? Response.Ok() 
            : Response.Fail();
    });

    return Response.Ok();
})
.WithWarmUpDuration(TimeSpan.FromSeconds(5))
.WithLoadSimulations(
    Simulation.KeepConstant(copies: 50, during: TimeSpan.FromSeconds(30))
);

// Scenario 3: Mixed usage scenario
var mixedScenario = Scenario.Create("mixed_usage_scenario", async context =>
{
    // Get all products step
    var step1 = await Step.Run("get_all_products", context, async () =>
    {
        var request = Http.CreateRequest("GET", $"{baseUrl}/api/products");
        var response = await Http.Send(httpClient, request);
        
        return !response.IsError 
            ? Response.Ok() 
            : Response.Fail();
    });

    // Get product by ID step
    var step2 = await Step.Run("get_product_by_id", context, async () =>
    {
        // Generate a random ID between 1 and 1000
        var id = Random.Shared.Next(1, 1000);
        
        var request = Http.CreateRequest("GET", $"{baseUrl}/api/products/{id}");
        var response = await Http.Send(httpClient, request);
        
        return !response.IsError 
            ? Response.Ok() 
            : Response.Fail();
    });

    // Search products step
    var step3 = await Step.Run("search_products", context, async () =>
    {
        // Generate a random search term
        var searchTerms = new[] { "product", "1", "2", "3", "4", "5" };
        var term = searchTerms[Random.Shared.Next(searchTerms.Length)];
        
        var request = Http.CreateRequest("GET", $"{baseUrl}/api/products/search?term={term}");
        var response = await Http.Send(httpClient, request);
        
        return !response.IsError 
            ? Response.Ok() 
            : Response.Fail();
    });

    // Create a product step
    var step4 = await Step.Run("create_product", context, async () =>
    {
        // Create a random product
        var product = new
        {
            Name = $"Test Product {Guid.NewGuid()}",
            Price = Random.Shared.Next(10, 100),
            Description = "A test product created during load testing",
            StockQuantity = Random.Shared.Next(1, 100)
        };
        
        var json = JsonSerializer.Serialize(product);
        var request = Http.CreateRequest("POST", $"{baseUrl}/api/products")
            .WithHeader("Content-Type", "application/json")
            .WithBody(new StringContent(json, Encoding.UTF8, "application/json"));
        
        var response = await Http.Send(httpClient, request);
        
        return !response.IsError 
            ? Response.Ok() 
            : Response.Fail();
    });

    return Response.Ok();
})
.WithWarmUpDuration(TimeSpan.FromSeconds(5))
.WithLoadSimulations(
    Simulation.KeepConstant(copies: 20, during: TimeSpan.FromSeconds(60))
);

// 3. Run the tests
NBomberRunner
    .RegisterScenarios(getAllProductsScenario, searchProductsScenario, mixedScenario)
    .WithReportFormats(ReportFormat.Html, ReportFormat.Csv)
    .WithReportFileName("product_api_load_test_report")
    .Run();

Console.WriteLine("Load test complete. Press any key to exit...");
Console.ReadKey();
```

This expanded test does several things:

1. It tests all four of our API endpoints
2. It creates three different test scenarios:
   - One that just hammers the GET all products endpoint
   - One that focuses on the search endpoint (which has our deliberate inefficiency)
   - A mixed scenario that simulates more realistic usage patterns
3. It uses different load patterns for each scenario

## Identifying Performance Bottlenecks

When you run this expanded test, you'll notice that the search endpoint performs much worse than the others. This is because we deliberately added a `Thread.Sleep(10)` to simulate a slow operation.

In real-world applications, performance bottlenecks are rarely this obvious, but they might include:

- Database queries that perform fine with a few records but choke when tables grow
- Memory leaks that only become apparent under sustained load
- Connection pool exhaustion
- Thread starvation
- Resource contention
- That innocent-looking foreach loop that becomes a performance killer at scale

Each of these issues is much easier (and cheaper) to fix before your code hits production.

## Fixing the Performance Bottleneck

Now that we've identified the performance bottleneck in our search endpoint, let's fix it. The issue is the `Thread.Sleep(10)` we added to simulate a slow operation, but in real applications, it might be an inefficient query, a missing index, or excessive data processing.

Let's update our `ProductRepository.cs` file to remove the artificial delay and optimize the search:

```csharp
public IEnumerable<Product> Search(string term)
{
    // Remove the artificial delay
    // Thread.Sleep(10); -- Remove this line
    
    // Use a case-insensitive comparison for better performance
    return _products.Where(p => 
        p.Name.Contains(term, StringComparison.OrdinalIgnoreCase) || 
        p.Description.Contains(term, StringComparison.OrdinalIgnoreCase));
}
```

In a real-world scenario with a database, you might:

1. Add an index to the search columns
2. Use full-text search instead of LIKE queries
3. Implement caching for common search terms
4. Limit the number of results returned

After making these changes, run your NBomber tests again to see the improvement.

## Advanced NBomber Techniques

Now that you have the basics down, let's explore some more advanced NBomber techniques.

### 1. Different Load Patterns

NBomber supports various load patterns to simulate different real-world scenarios:

```csharp
// Constant load - maintain a specific number of concurrent users
Simulation.KeepConstant(copies: 50, during: TimeSpan.FromMinutes(10))

// Step load - gradually increase load in steps
Simulation.InjectPerSec(rate: 10, during: TimeSpan.FromSeconds(30)),
Simulation.InjectPerSec(rate: 20, during: TimeSpan.FromSeconds(30)),
Simulation.InjectPerSec(rate: 30, during: TimeSpan.FromSeconds(30))

// Ramp load - gradually increase load linearly
Simulation.RampConstant(copies: 10, during: TimeSpan.FromSeconds(30)),
Simulation.RampConstant(copies: 50, during: TimeSpan.FromMinutes(2))

// Pulse load - simulate traffic spikes
Simulation.InjectPerSec(rate: 10, during: TimeSpan.FromSeconds(30)),
Simulation.InjectPerSec(rate: 50, during: TimeSpan.FromSeconds(30)),
Simulation.InjectPerSec(rate: 10, during: TimeSpan.FromSeconds(30))
```

Let's update our mixed scenario to use a more realistic load pattern:

```csharp
var mixedScenario = ScenarioBuilder.CreateScenario("mixed_usage_scenario", 
        getAllProductsStep, getProductByIdStep, searchProductsStep, createProductStep)
    .WithWarmUpDuration(TimeSpan.FromSeconds(5))
    .WithLoadSimulations(
        Simulation.InjectPerSec(rate: 10, during: TimeSpan.FromSeconds(30)),
        Simulation.InjectPerSec(rate: 20, during: TimeSpan.FromSeconds(30)),
        Simulation.InjectPerSec(rate: 30, during: TimeSpan.FromSeconds(30)),
        Simulation.InjectPerSec(rate: 40, during: TimeSpan.FromSeconds(30))
    );
```

### 2. Custom Metrics and Assertions

NBomber allows you to define custom metrics and assertions to validate your test results:

```csharp
// Define a custom metric to track response size
var getAllProductsStep = Step.Create("get_all_products", httpFactory, async context =>
{
    var response = await Http.CreateRequest("GET", $"{baseUrl}/api/products")
        .SendAsync(context);
        
    if (response.IsSuccessStatusCode)
    {
        var content = await response.Content.ReadAsStringAsync();
        var responseSize = content.Length;
        
        // Record the response size as a custom metric
        return Response.Ok(sizeBytes: responseSize);
    }
    
    return Response.Fail();
});

// Add assertions to validate test results
NBomberRunner
    .RegisterScenarios(getAllProductsScenario, searchProductsScenario, mixedScenario)
    .WithReportFormats(ReportFormat.Html, ReportFormat.Csv)
    .WithReportFileName("product_api_load_test_report")
    .WithAssertion(Assertion.ForScenario("get_all_products_scenario")
        .ResponseTime(percentile: 95, lessThan: TimeSpan.FromMilliseconds(100)))
    .WithAssertion(Assertion.ForScenario("search_products_scenario")
        .ResponseTime(percentile: 95, lessThan: TimeSpan.FromMilliseconds(200)))
    .Run();
```

## Integrating NBomber with CI/CD

To ensure your API's performance doesn't degrade over time, you should integrate NBomber tests into your CI/CD pipeline. Here's a simple example for GitHub Actions:

```yaml
name: Performance Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  performance-tests:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v1
      with:
        dotnet-version: 6.0.x
        
    - name: Restore dependencies
      run: dotnet restore
      
    - name: Build
      run: dotnet build --no-restore
      
    - name: Start API
      run: dotnet run --project ProductApi &
      
    - name: Wait for API to start
      run: sleep 10
      
    - name: Run NBomber tests
      run: dotnet run --project ProductApi.LoadTests
      
    - name: Upload performance test results
      uses: actions/upload-artifact@v2
      with:
        name: performance-test-results
        path: ProductApi.LoadTests/reports/
```

## When Your API Still Explodes (Despite Testing)

Sometimes, despite your best efforts, your API might still face performance issues in production. Maybe you missed a scenario, or perhaps the real-world usage patterns differ from your test cases. It happens to the best of us.

When this occurs, don't panic. The data and experience you gained from your NBomber testing will help you diagnose and fix the issue more quickly. You'll have a better understanding of your system's behavior under load and a framework in place to reproduce and verify the fix.

Here's a quick checklist for handling production performance issues:

1. **Collect data**: Gather logs, metrics, and any other information about the issue
2. **Reproduce locally**: Try to recreate the issue using NBomber with similar load patterns
3. **Identify bottlenecks**: Use the data to pinpoint the specific component that's struggling
4. **Fix and verify**: Implement a fix and verify it with NBomber before deploying
5. **Add to test suite**: Update your NBomber tests to include this scenario going forward

## Conclusion

In this complete guide, we've covered everything you need to know to get started with NBomber for load testing your C# APIs:

1. Setting up a simple API to test
2. Creating an NBomber test project
3. Writing basic and advanced load tests
4. Identifying and fixing performance bottlenecks
5. Using advanced NBomber features
6. Integrating with CI/CD

Load testing isn't just a nice-to-have; it's an essential part of building reliable APIs. NBomber makes this process accessible and efficient for .NET developers, allowing you to catch performance issues before they catch you.

So, the next time your API explodes during testing, don't see it as bad juju. See it as valuable feedback – your code is telling you exactly what it needs to succeed under pressure. Listen to it, fix the issues, and deploy with confidence.

Have you used NBomber or other load testing tools in your projects? What unexpected performance bottlenecks have you discovered? Share your experiences in the comments!
